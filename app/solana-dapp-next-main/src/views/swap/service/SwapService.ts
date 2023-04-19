import * as anchor from "@project-serum/anchor";
import {IDL as LpIdl, SimpleLiquidityPool} from "../../../../anchor/types/simple_liquidity_pool";
import {IDL as MoveTokenIdl} from "../../../../anchor/types/move_token";
import {AnchorBrowserClient} from "../../../utils/anchor-client-js/AnchorBrowserClient";
import {Program} from "@project-serum/anchor";
import {getProgramConstant, getProgramIdlConstant} from "../../../utils/anchor-client-js/utils";
import BigNumber from "bignumber.js";
import {notify} from "../../../utils/notifications";
import {Keypair, PublicKey} from "@solana/web3.js";
import {NATIVE_MINT} from "@solana/spl-token";

const VERBOSE = true;
const SIMPLE_LP_PROGRAM_ID = "GMDA6SqHUFzctniBczeBSsoLEfd3HaW161wwyAms2buL";


export async function initLp(
  basePubKey: anchor.web3.PublicKey,
  quotePubKey: anchor.web3.PublicKey,
  rate: string,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  },
): Promise<{tx: string, lpPubKey: PublicKey}> {
  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);

  const program = new anchor.Program(LpIdl, SIMPLE_LP_PROGRAM_ID, provider)

  return init_new_lp(
    program,
    quotePubKey,
    rate,
    provider.wallet as any,
    true,
    data,
  )
}

export async function addLiquidity(
  quote: PublicKey,
  baseAmount: string,
  quoteAmount: string,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  },
): Promise<{
  tx: string,
  lpBalances: {quote: number, base: number}
}> {
  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);
  const program = new anchor.Program(LpIdl, SIMPLE_LP_PROGRAM_ID, provider)

  return add_liquidity_to_exist_lp(
    program,
    quote,
    {
      solAmount: baseAmount ? parseFloat(baseAmount) : 0,
      tokenAmount: quoteAmount ? parseFloat(quoteAmount) : 0,
    },
    {wallet, connection, provider},
  )
}

export async function swap(
  from: PublicKey,
  to: PublicKey,
  amountFrom: string,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  },
): Promise<{
  tx: string,
  lpBalances: {quote: number, base: number}
}> {
  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);
  const program = new anchor.Program(LpIdl, SIMPLE_LP_PROGRAM_ID, provider)

  return swap_token(
    program,
    from,
    to,
    amountFrom ? parseFloat(amountFrom) : 0,
    {wallet, connection, provider},
  )
}

// Copied from instructions/init.test.ts
async function init_new_lp(
  program: Program<SimpleLiquidityPool>,
  quote: anchor.web3.PublicKey,
  rate: string,
  authority: anchor.web3.Keypair,
  logError = true,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  },
) {
  const {wallet, connection} = data;

  const {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    LP_FEE_SEED_PREFIX,
    LP_RATE_DECIMAL,
  } = getThisProgramConstants(program);

  const [lpPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_SEED_PREFIX,
      quote.toBuffer(),
    ],
    program.programId
  ))
  const [lpFeePubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_FEE_SEED_PREFIX,
      quote.toBuffer(),
    ],
    program.programId
  ))
  const [lpLiquidityPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_LIQUIDITY_PREFIX,
      quote.toBuffer(),
    ],
    program.programId
  ))
  VERBOSE && console.log('{init_new_lp} liquidityPoolPubKey, FeePubKey: ', {
    lpPubKey: lpPubKey.toString(),
    lpFeePubKey: lpFeePubKey.toString(),
    lpLiquidityPubKey: lpLiquidityPubKey.toString(),
  });


  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quote,
    owner: lpLiquidityPubKey
    // owner: lpPubKey,
  });
  const lpFeeQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quote,
    owner: lpFeePubKey
  });

  console.log('{init_new_lp} a: ', {
    lp: lpPubKey,
    tokenQuote: quote,
    lpLiquidity: lpLiquidityPubKey,
    lpLiquidityQuoteAta: lpLiquidityQuoteAta,
    lpFee: lpFeePubKey,
    lpFeeQuoteAta: lpFeeQuoteAta,
    user: authority.publicKey,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
  });

  const fixedRate = new BigNumber(rate).toNumber();
  const tx = await program.methods.initialize(fixedRate * Math.pow(10, LP_RATE_DECIMAL))
    .accounts({
      lp: lpPubKey,
      tokenQuote: quote,
      lpLiquidity: lpLiquidityPubKey,
      lpLiquidityQuoteAta: lpLiquidityQuoteAta,
      lpFee: lpFeePubKey,
      lpFeeQuoteAta: lpFeeQuoteAta,
      user: authority.publicKey,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([])
    .rpc()
    .catch(e => {
      VERBOSE && logError && console.log('Error: ', e); // show on-chain logs
      throw e;
    });

  console.log('{init_new_lp} tx: ', tx);

  return {
    tx,
    lpPubKey,
  };
}


/**
 * Copied from instructions/add_lp.test.ts
 * with some modifications
 */
async function add_liquidity_to_exist_lp(
  program: Program<SimpleLiquidityPool>,
  quote: PublicKey,
  option: {
    solAmount: number,
    tokenAmount: number,
  },
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
    provider: anchor.Provider,
  },
) {
  const {solAmount: baseDepositAmount, tokenAmount: quoteDepositAmount} = option;
  const {wallet, connection, provider} = data;

  const {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    TOKEN_DECIMAL,
  } = getThisProgramConstants(program);


  // const tokenBasePubKey = NATIVE_MINT;  // Sol
  // const prevMintToken = getPrevMintTokenInfoFromTmpData(); // This test must run after mint test; Test run async but mochajs test case will run once by one
  // const tokenQuotePubKey = new anchor.web3.PublicKey(prevMintToken.mintKeypair.publicKey)
  const tokenQuotePubKey = quote;
  const [lpPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_SEED_PREFIX,
      // tokenBasePubKey.toBuffer(),
      tokenQuotePubKey.toBuffer(),
    ],
    program.programId
  ))
  const [lpLiquidityPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_LIQUIDITY_PREFIX,
      tokenQuotePubKey.toBuffer(),
    ],
    program.programId
  ))

  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: tokenQuotePubKey,
    owner: lpLiquidityPubKey,
  });
  const userQuoteAta = await anchor.utils.token.associatedAddress({
    mint: tokenQuotePubKey,
    owner: wallet.publicKey
  });

  const lpBalances = {
    before: {quote: 0, base: 0},
    after: {quote: 0, base: 0},
  }
  // lpBalances.before.base = await provider.connection.getBalance(lpLiquidityPubKey);
  // lpBalances.before.quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();
  // console.log('{test___add_liquidity_to_exist_lp} lpBalances before: ', lpBalances);

  const baseAmount = baseDepositAmount * 1e9;
  const quoteAmount = quoteDepositAmount * Math.pow(10, TOKEN_DECIMAL);

  console.log('{add_liquidity_to_exist_lp} : ', {
    baseAmount,
    quoteAmount,
  });
  const tx = await program.methods.addLiquidity(
    new anchor.BN(baseAmount),  // Solana decimal is 9
    new anchor.BN(quoteAmount), // My token
  )
    .accounts({
      lp: lpPubKey,
      tokenQuote: tokenQuotePubKey,
      lpLiquidity: lpLiquidityPubKey,
      lpLiquidityQuoteAta: lpLiquidityQuoteAta,
      userQuoteAta: userQuoteAta,
      user: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([])
    .rpc()
    .catch(e => {
      console.log('Error: ', e); // show on-chain logs
      throw e;
    });
  console.log('{test___add_liquidity_to_exist_lp} tx: ', tx);

  lpBalances.after.base = await provider.connection.getBalance(lpLiquidityPubKey);
  lpBalances.after.quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();

  return {
    tx,
    lpBalances: {
      base: lpBalances.after.base / 1e9,
      quote: lpBalances.after.quote / Math.pow(10, TOKEN_DECIMAL),
    }
  };
}

/**
 * Copied from programs/simple-liquidity-pool/src/instructions/swap.test.ts
 * with some mod
 */
async function swap_token(
  program: Program<SimpleLiquidityPool>,
  fromPubKey: PublicKey,
  toPubKey: PublicKey,
  fromAmount: number,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
    provider: anchor.Provider,
  }
) {
  console.log('{swap_token} : ', {
    fromPubKey,
    toPubKey,
    fromAmount,
  });
  const {wallet, connection, provider} = data;
  const showException = true;

  const swappingBaseToQuote = fromPubKey.equals(NATIVE_MINT);
  const [basePubKey, quotePubKey] = swappingBaseToQuote
    ? [fromPubKey, toPubKey]
    : [toPubKey, fromPubKey];

  const {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    LP_FEE_SEED_PREFIX,
    LP_RATE_DECIMAL,
    LP_SWAP_FEE_PERMIL,
    TOKEN_DECIMAL,
  } = getThisProgramConstants(program);

  const NATIVE_SOL_DECIMAL = 9;
  const fromDecimals = swappingBaseToQuote ? NATIVE_SOL_DECIMAL : TOKEN_DECIMAL;
  // const toDecimals = fromPubKey.equals(NATIVE_MINT) ? TOKEN_DECIMAL: NATIVE_SOL_DECIMAL;

  const [lpPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_SEED_PREFIX,
      quotePubKey.toBuffer(),
    ],
    program.programId
  ))
  const [lpFeePubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_FEE_SEED_PREFIX,
      quotePubKey.toBuffer(),
    ],
    program.programId
  ))
  const [lpLiquidityPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_LIQUIDITY_PREFIX,
      quotePubKey.toBuffer(),
    ],
    program.programId
  ))

  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quotePubKey,
    owner: lpLiquidityPubKey,
  });
  const feeAta = await anchor.utils.token.associatedAddress({
    mint: quotePubKey,
    owner: lpFeePubKey
  });
  const userQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quotePubKey,
    owner: wallet.publicKey
  });

  const lpBalances = {
    before: {quote: 0, base: 0},
    after: {quote: 0, base: 0},
  }
  const lpFeeBalances = {
    before: {quote: 0, base: 0},
    after: {quote: 0, base: 0},
  }

  VERBOSE && console.log('{swap_token} : ', {
    lpPubKey: lpPubKey.toString(),
    lpLiquidityPubKey: lpLiquidityPubKey.toString(),
    lpFeePubKey: lpFeePubKey.toString(),
    feeAta: feeAta.toString(),
    lpLiquidityQuoteAta: lpLiquidityQuoteAta.toString(),
    lpBalances,
    lpFeeBalances,
    fromAmountBN: fromAmount * Math.pow(10, fromDecimals),
  });

  const tx = await program.methods.swap(
    fromPubKey,
    toPubKey,
    new anchor.BN(fromAmount * Math.pow(10, fromDecimals)),
  )
    .accounts({
      lp: lpPubKey,
      tokenQuote: quotePubKey,
      lpLiquidity: lpLiquidityPubKey,
      lpLiquidityQuoteAta: lpLiquidityQuoteAta,
      lpFee: lpFeePubKey,
      lpFeeQuoteAta: feeAta,
      userQuoteAta: userQuoteAta,
      user: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([])
    .rpc()
    .catch(e => {
      VERBOSE && showException && console.log('Error: ', e); // show on-chain logs
      throw e;
    });
  VERBOSE && console.log('{test__swap_token} tx: ', tx);

  lpBalances.after.base = await provider.connection.getBalance(lpLiquidityPubKey);
  lpBalances.after.quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();

  console.log('{swap_token} lpBalances: ', lpBalances);

  return {
    tx,
    lpBalances: {
      base: lpBalances.after.base / 1e9,
      quote: lpBalances.after.quote / Math.pow(10, TOKEN_DECIMAL),
    },
  };
}


export async function getLpBalances(
  quote: PublicKey,
  data: {
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  }
) {
  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);
  const program = new anchor.Program(LpIdl, SIMPLE_LP_PROGRAM_ID, provider)

  const {
    LP_LIQUIDITY_PREFIX,
    TOKEN_DECIMAL,
  } = getThisProgramConstants(program);

  const [lpLiquidityPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_LIQUIDITY_PREFIX,
      quote.toBuffer(),
    ],
    program.programId
  ))
  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quote,
    owner: lpLiquidityPubKey,
  });

  let lpBalances_after_base = 0;
  let lpBalances_after_quote = 0;
  try {
    lpBalances_after_base = await provider.connection.getBalance(lpLiquidityPubKey)
  } catch (e) {
    console.log('{getLpBalances} base e: ', e);
  }
  try {
    lpBalances_after_quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();
  } catch (e) {
    console.log('{getLpBalances} quote e: ', e);
  }

  console.log('{getLpBalances} : ', lpBalances_after_base, lpBalances_after_quote);

  return {
    base: lpBalances_after_base / 1e9,
    quote: lpBalances_after_quote / Math.pow(10, TOKEN_DECIMAL),
  }
}



function injectToWindow(
  program,
  anchor,
  wallet,
  connection,
) {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.tmp_swap_program = program;
    // @ts-ignore
    window.tmp_anchor = anchor;
    // @ts-ignore
    window.tmp_wallet = wallet;
    // @ts-ignore
    window.tmp_connection = connection;
  }
}


const exist_lp = {};
export const checkLpExistMemo = async (quote: PublicKey, data: {
  wallet: anchor.Wallet,
  connection: anchor.web3.Connection,
}) => {
  if (exist_lp[quote.toString()]) {
    return exist_lp[quote.toString()];
  }

  const lpAddr = await fetchExistLp(quote, data);
  if (!!lpAddr) {
    exist_lp[quote.toString()] = lpAddr;
  }

  return lpAddr;
}

export async function fetchExistLp(quote: PublicKey, data: {
  wallet: anchor.Wallet,
  connection: anchor.web3.Connection,
}): Promise<string> {
  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);
  const program = new anchor.Program(LpIdl, SIMPLE_LP_PROGRAM_ID, provider)


  injectToWindow(program, anchor, wallet, connection);


  const {
    LP_SEED_PREFIX,
  } = getThisProgramConstants(program);

  const [lpPubKey] = (anchor.web3.PublicKey.findProgramAddressSync(
    [LP_SEED_PREFIX, quote.toBuffer()],
    program.programId
  ))
  try {
    /**
     * NOT WORKING in browser - still investigating
     * Worked in Nodejs
     */
    // const account = await program.account.fixedRateLp.fetch(lpPubKey);
    // console.log('{fetchExistLp} lpPubKey, account: ', lpPubKey, account);
    // if (account.tokenQuote.equals(quote)) {
    //   return lpPubKey.toString();
    // }
    const a = await connection.getAccountInfo(lpPubKey);
    if (!!a) {
      // have account
      if (a.lamports && a.owner.equals(program.programId)) {
        console.log('{fetchExistLp} lpPubKey exist: ', lpPubKey.toString());
        return lpPubKey.toString();
      }
    }
  } catch (e) {
    console.warn('{fetchExistLp} e: ', e);
  }

  console.log('{fetchExistLp} lpPubKey NOT exist: ', lpPubKey.toString());
  return ""
}


export function getThisProgramConstants(program: Program<SimpleLiquidityPool>) {
  const LP_SEED_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_SEED_PREFIX", program)), "utf8");
  const LP_LIQUIDITY_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_LIQUIDITY_PREFIX", program)), "utf8");
  const LP_FEE_SEED_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_FEE_SEED_PREFIX", program)), "utf8");
  const LP_RATE_DECIMAL = parseInt(getProgramConstant("LP_RATE_DECIMAL", program));
  const LP_SWAP_FEE_PERMIL = parseInt(getProgramConstant("LP_SWAP_FEE_PERMIL", program));
  const TOKEN_DECIMAL = parseInt(getProgramIdlConstant("TOKEN_DECIMAL", MoveTokenIdl));

  return {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    LP_FEE_SEED_PREFIX,
    LP_RATE_DECIMAL,
    LP_SWAP_FEE_PERMIL,
    TOKEN_DECIMAL,
  };
}


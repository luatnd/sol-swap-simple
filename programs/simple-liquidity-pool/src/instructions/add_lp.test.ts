import * as anchor from "@project-serum/anchor";
import {getProvider, Program} from "@project-serum/anchor";
import {SimpleLiquidityPool} from "../../../../target/types/simple_liquidity_pool";
import {sleep} from "../../../../tests/helpers/time";
import {getCurrentProvider, getProviderWallet, VERBOSE} from "../../../../tests/helpers/test-env";
import {assert, expect} from "chai";
import {NATIVE_MINT, NATIVE_MINT_2022} from "@solana/spl-token"
import {getPrevMintTokenInfoFromTmpData} from "../../../move-token/src/instructions/create_token.test";
import {getThisProgramConstants} from "./utils/utils.test";


export default function test__add_liquidity(program: Program<SimpleLiquidityPool>) {
  it("Anyone with enough SOL balance can add liquidity to a LP", async () => test___add_liquidity_to_exist_lp(program));
}

async function test___add_liquidity_to_exist_lp(program: Program<SimpleLiquidityPool>) {
  const fixedRateDecimal = 10;
  const baseDepositAmount = 0.3;
  return add_liquidity_to_exist_lp(program, {
    solAmount: baseDepositAmount,
    tokenAmount: baseDepositAmount * fixedRateDecimal,
  })
}

export async function add_liquidity_to_exist_lp(program: Program<SimpleLiquidityPool>, option: {
  solAmount: number,
  tokenAmount: number,
}) {
  console.log('{test___add_liquidity_to_exist_lp} : ', Date.now());
  const {solAmount: baseDepositAmount, tokenAmount: quoteDepositAmount} = option;


  const provider = getCurrentProvider();
  const wallet = getProviderWallet();

  const {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    TOKEN_DECIMAL,
  } = getThisProgramConstants(program);


  // const tokenBasePubKey = NATIVE_MINT;  // Sol
  const prevMintToken = getPrevMintTokenInfoFromTmpData(); // This test must run after mint test; Test run async but mochajs test case will run once by one
  const tokenQuotePubKey = new anchor.web3.PublicKey(prevMintToken.mintKeypair.publicKey)
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

  // const baseAta = await anchor.utils.token.associatedAddress({
  //   mint: tokenBasePubKey,
  //   owner: lpPubKey
  // });
  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: tokenQuotePubKey,
    owner: lpLiquidityPubKey,
    // owner: lpPubKey,
  });
  const userQuoteAta = await anchor.utils.token.associatedAddress({
    mint: tokenQuotePubKey,
    owner: wallet.payer.publicKey
  });

  const lpBalances = {
    before: {quote: 0, base: 0},
    after: {quote: 0, base: 0},
  }
  lpBalances.before.base = await provider.connection.getBalance(lpLiquidityPubKey);
  lpBalances.before.quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();
  // console.log('{test___add_liquidity_to_exist_lp} lpBalances before: ', lpBalances);

  const baseAmount = baseDepositAmount * 1e9;
  const quoteAmount = quoteDepositAmount * Math.pow(10, TOKEN_DECIMAL);

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
      user: wallet.payer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([wallet.payer])
    .rpc()
    .catch(e => {
      console.log('Error: ', e); // show on-chain logs
      throw e;
    });
  console.log('{test___add_liquidity_to_exist_lp} tx: ', tx);

  lpBalances.after.base = await provider.connection.getBalance(lpLiquidityPubKey);
  lpBalances.after.quote = new anchor.BN((await provider.connection.getTokenAccountBalance(lpLiquidityQuoteAta)).value.amount).toNumber();

  // lpBalances must increase
  VERBOSE && console.log('{test___add_liquidity_to_exist_lp} lpBalances after: ', lpBalances);
  expect(lpBalances.after.base).to.be.eq(lpBalances.before.base + baseAmount);
  expect(lpBalances.after.quote).to.be.eq(lpBalances.before.quote + quoteAmount);
}

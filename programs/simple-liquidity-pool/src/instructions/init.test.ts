import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {SimpleLiquidityPool} from "../../../../target/types/simple_liquidity_pool";
import {sleep} from "../../../../tests/helpers/time";
import {getProviderWallet, VERBOSE} from "../../../../tests/helpers/test-env";
import {assert, expect} from "chai";
import {NATIVE_MINT, NATIVE_MINT_2022} from "@solana/spl-token"
import {getPrevMintTokenInfoFromTmpData} from "../../../move-token/src/instructions/create_token.test";
import {airDropSolIfBalanceLowerThan} from "../../../../tests/helpers/token";
import {getPrevLpPairFromTmpData, getThisProgramConstants, persistPrevLpPairToTmpData} from "./utils/utils.test";


export default function test__init(program: Program<SimpleLiquidityPool>) {
  it("can init lp and can init only once", async () => test_init_lp_only_once(program));
  it("Other wallet cannot init same pair", async () => test_reinit_lp_by_other_wallet(program));
}

/**
 * This test must run only once per liquidity pair
 * Default Pair: Sol - Your Token
 * Your Token is stored here: tests/tmp/create-token.json
 * It's the token minted with `move-token` tests
 */
async function test_init_lp_only_once(program: Program<SimpleLiquidityPool>) {
  console.log('{test_init_lp_only_once} : ', Date.now());

  const wallet = getProviderWallet();

  // const tokenBasePubKey = NATIVE_MINT;  // Sol
  const prevMintToken = getPrevMintTokenInfoFromTmpData(); // This test must run after mint test; Test run async but mochajs test case will run once by one
  const prevPair = getPrevLpPairFromTmpData();

  /**
   * Skip to test if pair is not new pair
   * // because init will success only if pair was not exist
   * This test must run only once per liquidity pair,
   */
  if (prevPair.quoteTokenPubKey == prevMintToken.mintKeypair.publicKey) {
    console.log('{test_init_lp_only_once} SKIP because this LP pair have been already init');
    return;
  }


  const tokenQuotePubKey = new anchor.web3.PublicKey(prevMintToken.mintKeypair.publicKey)
  const {tx, liquidityPoolPubKey} = await init_new_lp(
    program,
    // tokenBasePubKey,
    tokenQuotePubKey,
    wallet.payer,
  );
  assert(!!tx, "Tx should not be empty");
  // Store tmp data
  persistPrevLpPairToTmpData({
    quoteTokenPubKey: tokenQuotePubKey.toString(),
  })

  let tx2 = "";
  try {
    const {tx} = await init_new_lp(
      program,
      // tokenBasePubKey,
      tokenQuotePubKey,
      wallet.payer,
      false,
    );
    tx2 = tx;
  } catch (e) {
    // console.log('{test_init_lp} e: ', e);
    // e.logs will show program logs
    expect(e.message.endsWith("error: 0x0"))
  }
  // tx2 should fail
  expect(tx2, "Re-init same pair should failed").to.be.empty;

  // Account must be created
  const lpAccount = await program.account.fixedRateLp.fetch(liquidityPoolPubKey);
  assert(lpAccount.bump > 0, "Bump must be saved in state");
}

async function test_reinit_lp_by_other_wallet(program: Program<SimpleLiquidityPool>) {
  console.log('{test_reinit_lp_by_other_wallet} : ', Date.now());

  // new wallet
  const walletKeyPair = anchor.web3.Keypair.generate();
  await airDropSolIfBalanceLowerThan(0.1, walletKeyPair.publicKey);

  // const tokenBasePubKey = NATIVE_MINT;  // Sol
  const prevMintToken = getPrevMintTokenInfoFromTmpData(); // This test must run after mint test; Test run async but mochajs test case will run once by one
  const tokenQuotePubKey = new anchor.web3.PublicKey(prevMintToken.mintKeypair.publicKey)

  let tx2 = "";
  try {
    const {tx} = await init_new_lp(
      program,
      // tokenBasePubKey,
      tokenQuotePubKey,
      walletKeyPair,
      false,
    );
    tx2 = tx;
  } catch (e) {
    // console.log('{test_init_lp} e: ', e);
    // e.logs will show program logs
    expect(e.message.endsWith("error: 0x0"))
  }
  // tx2 should fail
  expect(tx2, "Re-init same pair should failed").to.be.empty;
}

async function init_new_lp(
  program: Program<SimpleLiquidityPool>,
  // base: anchor.web3.PublicKey,
  quote: anchor.web3.PublicKey,
  authority: anchor.web3.Keypair,
  logError = true,
) {
  const {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    LP_FEE_SEED_PREFIX,
    LP_RATE_DECIMAL,
  } = getThisProgramConstants(program);

  const [lpPubKey, bump] = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      LP_SEED_PREFIX,
      // base.toBuffer(),
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


  // const baseAta = await anchor.utils.token.associatedAddress({
  //   mint: base,
  //   owner: liquidityPoolPubKey
  // });
  const lpLiquidityQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quote,
    owner: lpLiquidityPubKey
    // owner: lpPubKey,
  });
  const lpFeeQuoteAta = await anchor.utils.token.associatedAddress({
    mint: quote,
    owner: lpFeePubKey
  });

  const fixedRate = 10;
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
    .signers([authority])
    .rpc()
    .catch(e => {
      VERBOSE && logError && console.log('Error: ', e); // show on-chain logs
      throw e;
    });
  console.log('{init_new_lp} tx: ', tx);

  return {
    tx,
    liquidityPoolPubKey: lpPubKey,
  };
}

import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {MoveToken} from "../../../../target/types/move_token";
import {getCurrentProvider, getProviderWallet, getTestTokenMetadata} from "../../../../tests/helpers/test-env";
import {getPrevMintTokenInfoFromTmpData} from "./create_token.test";
import {sleep} from "../../../../tests/helpers/time";
import {assert, expect} from "chai";
import {airdropSOL} from "../../../../tests/helpers/token";


export default function test__mintTokenToOtherWallet(program: Program<MoveToken>) {
  it("can mint token to another wallet, or airdrop", async () => mintTokenToAnyWallet(program));
}

/**
 * Test cases:
 * - tx success
 * - cannot mint to a wallet twice
 * - MOVE balance after minting increases by amount arg
 */
async function mintTokenToAnyWallet(program: Program<MoveToken>) {
  console.log('{mintTokenToAnyWallet} : ', Date.now());
  await sleep(300);

  const AIR_DROP_AMOUNT = 1.5;
  // const RECIPIENT_ADDR = "CKsW2dWontvwCJTyesYEbZ8nScx8LiL1utjkvmwhHLkT";
  const RECIPIENT_ADDR = anchor.web3.Keypair.generate().publicKey; // airdrop each user once and only once

  const provider = getCurrentProvider();
  const payer = getProviderWallet(); // use my wallet to pay mint fee
  const tokenInfo = getTestTokenMetadata();

  // await sleep(1000);
  const prevMintToken = getPrevMintTokenInfoFromTmpData(); // Test run async but mochajs test case will run once by one
  // const mintKeypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(prevMintToken.mintKeypair.secret));
  const mintKeypairPubKey = new anchor.web3.PublicKey(prevMintToken.mintKeypair.publicKey);
  console.log(`{mintTokenToAnyWallet} mint addr: ${mintKeypairPubKey}`);

  const recipientPubKey = new anchor.web3.PublicKey(RECIPIENT_ADDR);
  console.log(`Recipient pubkey: ${recipientPubKey}`);

  // Airdrop 1 SOL to recipient for paying for the transaction
  // Don't need to do so in this new code version

  const [mintAuthorityPda, mintAuthorityPdaBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_authority_"), // TODO: get from program.constants
      mintKeypairPubKey.toBuffer(),
    ],
    program.programId,
  );

  const recipientAta = await anchor.utils.token.associatedAddress({
    mint: mintKeypairPubKey,
    owner: recipientPubKey
  });
  console.log(`associatedTokenAccount: ${recipientAta}`);

  let oldRecipientSplBalance = 0;
  try {
    oldRecipientSplBalance = (await provider.connection.getTokenAccountBalance(recipientAta)).value.uiAmount;
  } catch (e) {}

  const tx = await program.methods.mintToAnotherWallet(
    new anchor.BN(AIR_DROP_AMOUNT * Math.pow(10, tokenInfo.decimals)),
    mintAuthorityPdaBump
  )
    .accounts({
      mintAccount: mintKeypairPubKey,
      mintAuthority: mintAuthorityPda,
      recipient: recipientPubKey,
      recipientAta: recipientAta,
      payer: payer.publicKey,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([payer.payer])
    .rpc();
  console.log("{mintTokenToAnyWallet} tx", tx);
  assert(!!tx, "Tx should not be empty");

  // Test case: Balance of recipient should be increased by X
  const newRecipientSplBalance = (await provider.connection.getTokenAccountBalance(recipientAta)).value.uiAmount;
  const EPSILON = 1e-6;
  expect(newRecipientSplBalance - oldRecipientSplBalance).to.be.approximately(AIR_DROP_AMOUNT, EPSILON, `Balance of recipient should be increased by ${AIR_DROP_AMOUNT} tokens`);
}

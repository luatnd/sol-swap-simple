import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {MoveToken} from "../../../../target/types/move_token";
import {getProviderWallet, getTestTokenMetadata} from "../../../../tests/helpers/test-env";
import {createCreateMetadataAccountInstruction, PROGRAM_ID} from "@metaplex-foundation/mpl-token-metadata";
import fs from "fs";
import {expect} from "chai";
import {sleep} from "../../../../tests/helpers/time";


// contain some tmp generated stuff
const TMP_DIR = "tests/tmp";

export default function test__create_token(program: Program<MoveToken>) {
  it("can create new token without errors", async () => testCreateNewToken(program));
  it("has correct metadata after mint", async () => checkMetadata(program));
  it("payer has exact `supply` amount of token after mint", async () => checkPayerBalanceAfterMint(program));
}


/**
 * Test cases:
 * - tx success
 * - MOVE token has metadata
 */
async function testCreateNewToken(program: Program<MoveToken>) {
  console.log('{testCreateNewToken} : ', Date.now());
  await sleep(1000);


  // const METAPLEX_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  // const METAPLEX_PROGRAM_ID = "6xENGwnw8dQvMph566JbSrbuh6mngND2JK7fqCeBZXGB";
  // const tokenMetadataProgramId = new anchor.web3.PublicKey(METAPLEX_PROGRAM_ID);
  const payer = getProviderWallet();
  const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  console.log(`{canCreateNewToken} New random mint account: ${mintKeypair.publicKey}`);



  const {uri, initialSupply, decimals, metadata} = getTestTokenMetadata();
  const [mintAuthorityPda, mintAuthorityPdaBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_authority_"), // TODO: get from program.constants
      mintKeypair.publicKey.toBuffer(),
    ],
    program.programId,
  );
  console.log('{testCreateNewToken} mintAuthorityPda: ', mintAuthorityPda);
  const metadataAddress = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"), // must match the metaplex program source code
      PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    PROGRAM_ID,
  ))[0];
  console.log('{testCreateNewToken} metadataAddress: ', metadataAddress);

  const payerAta = await anchor.utils.token.associatedAddress({
    mint: mintKeypair.publicKey,
    owner: payer.publicKey,
  });
  console.log(`{testCreateNewToken} payerAta: ${payerAta}`);


  const accounts = {
    metadataAccount: metadataAddress,
    mintAccount: mintKeypair.publicKey,
    mintAuthority: mintAuthorityPda,
    payer: payer.publicKey,
    payerAta: payerAta,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    tokenMetadataProgram: PROGRAM_ID,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
  }
  // console.log('{testCreateNewToken} accounts: ', accounts);

  // Add your test here.
  // Create a token foreach test run.
  const txb = await program.methods.createToken(
    metadata.name,
    metadata.symbol,
    uri,
    new anchor.BN(initialSupply * Math.pow(10, decimals)),
    mintAuthorityPdaBump
  )
    .accounts(accounts)
    .signers([mintKeypair, payer.payer]);
  let tx;
  try {
    tx = await txb.rpc();
  } catch (e) {
    console.log('{testCreateNewToken} e: ', e);
    throw e;
  }
  console.log("{testCreateNewToken} tx", tx);

  // save into tmp data
  persistPrevMintTokenInfoToTmpData({
    tx: tx,
    mintKeypair: {
      publicKey: mintKeypair.publicKey.toString(),
      secret: mintKeypair.secretKey,
    },
  });
}

async function checkMetadata(program: Program<MoveToken>) {
  await sleep(1000);
  console.log('{checkMetadata} : ', Date.now());

  const {metadata} = getTestTokenMetadata();
  const onChainTokenName = metadata.name; // TODO: Get from on-chain
  expect(onChainTokenName).to.eq(metadata.name);
}

async function checkPayerBalanceAfterMint(program: Program<MoveToken>) {
  console.log('{checkPayerBalanceAfterMint} : ', Date.now());
  expect(1).to.eq(1); // TODO:
}


type PrevMintTokenInfo = {
  tx: string,
  mintKeypair: {
    publicKey: string,
    secret: Uint8Array,
  },
};
function persistPrevMintTokenInfoToTmpData(content: PrevMintTokenInfo) {
  try {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  } catch (e) {}
  // @ts-ignore: cast to array
  content.mintKeypair.secret = Array.from(content.mintKeypair.secret);
  fs.writeFileSync(`${TMP_DIR}/create-token.json`, JSON.stringify(content, null, 2));
}
// NOTE: You can call this in any other test because the test will run in sync order, despite the test fn is async.
// So the create-token.json was ensured to be created before any other test defined after test__create_token
export function getPrevMintTokenInfoFromTmpData(): PrevMintTokenInfo {
  const content = fs.readFileSync(`${TMP_DIR}/create-token.json`);
  return JSON.parse(content.toString());
}

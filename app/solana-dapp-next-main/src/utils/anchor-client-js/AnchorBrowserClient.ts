import * as anchor from "@project-serum/anchor";

export class AnchorBrowserClient {
  static getProvider(connection: anchor.web3.Connection, wallet: anchor.Wallet, opts?: anchor.web3.ConfirmOptions) {
    if (!opts) {
      opts = {commitment: "confirmed"};
    }
    return new anchor.AnchorProvider(connection, wallet, opts)
  }

  /**
   * @deprecated plz use direct new anchor.Program for short, this is just for reminder
   */
  static getProgram(programId: anchor.Address, idl: anchor.Idl, provider: anchor.AnchorProvider): anchor.Program {
    const program = new anchor.Program(idl, programId, provider);
    return program;
  }

  /**
   * @deprecated Plz don't call this fn, Just for code reference, it's not work all situation
   */
  static async confirmTransaction(
    tx: anchor.web3.Transaction,
    wallet: anchor.Wallet,
    connection: anchor.web3.Connection,
  ) {
    const latestBlockHash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockHash.blockhash

    // tx.sign(keypair); // must sign after set recentBlockhash

    const signedTx = await wallet.signTransaction(tx)
    console.log('{confirmTransaction} signedTx: ', signedTx);

    const signature = await connection.sendRawTransaction(signedTx.serialize())
    console.log('{confirmTransaction} signature: ', signature);

    const res = await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      }
      // , 'confirmed'
    );
    console.log('{confirmTransaction} res: ', res);

    return res;
  }

  static getCluster(connection: anchor.web3.Connection): anchor.web3.Cluster {
    const rpcUrl = connection?.rpcEndpoint;
    if (rpcUrl.indexOf('devnet.') > -1) {
      return 'devnet';
    }
    if (rpcUrl.indexOf('api.solana') > -1) {
      return 'mainnet-beta';
    }
    if (rpcUrl.indexOf('testnet') > -1) {
      return 'testnet';
    }

    return undefined;
  }

  static isDevNet(connection) {
    return AnchorBrowserClient.getCluster(connection) === 'devnet';
  }
}
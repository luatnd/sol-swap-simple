import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SimpleLiquidityPool } from "../target/types/simple_liquidity_pool";

describe("simple-liquidity-pool", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SimpleLiquidityPool as Program<SimpleLiquidityPool>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});

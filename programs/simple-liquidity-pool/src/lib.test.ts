import {Program} from "@project-serum/anchor";
import {SimpleLiquidityPool} from "../../../target/types/simple_liquidity_pool";
import testProgram from "../../../tests/helpers/testProgram";
import test__init from "./instructions/init.test";
import test__add_liquidity from "./instructions/add_lp.test";
import test__swap from "./instructions/swap.test";

const tests = [
  test__init,
  test__add_liquidity,
  test__swap,
  // test__fullFlow,
];
testProgram<SimpleLiquidityPool>("SimpleLiquidityPool", tests)

/**
 * Some test require multiple sub module can be defined here
 */
function test__fullFlow(program: Program<SimpleLiquidityPool>) {
  it("example test", async () => {
    /*
    1. init LP
    2. Add liquidity: anyone add LP is LP provider, can get profit
    3. Swap + generate profit for LP providers
    4. Remove liquidity
    5. Withdraw LP provider profit
     */
  });
}

import {Program} from "@project-serum/anchor";
import { MoveToken } from "../../../target/types/move_token";
import testProgram from "../../../tests/helpers/testProgram";
import test__create_token from "./instructions/create_token.test"
import test__mintTokenToOtherWallet from "./instructions/mint_to_another_wallet.test";

const tests = [
  // TODO: run test__create_token once then comment it out when you don't wanna generate any new token
  test__create_token,
  test__mintTokenToOtherWallet,
  test__exampleTestRequireAllSubModule,
];
testProgram<MoveToken>("MoveToken", tests)

/**
 * Some test require multiple sub module can be defined here
 */
function test__exampleTestRequireAllSubModule(program: Program<MoveToken>) {
  it("example test", async () => {});
}

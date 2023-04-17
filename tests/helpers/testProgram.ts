import * as anchor from "@project-serum/anchor";
import {Program, Idl} from "@project-serum/anchor";
import {getTestProgram} from "./test-env";

/**
 * Run test for a program.
 *
 * @param program_name is the anchor program name in Capitalize format,
 *        key to access anchor.workspace.<program_name>
 *        You can get it from target/types/<program>.ts"
 *
 *        For example:
 *          Cargo.toml: package.name = "move-token"
 *          Cargo.toml: lib.name = "move_token"
 *          program_name = "MoveToken"
 * @param tests
 */
export default function testProgram<TProgram extends Idl>(
  program_name: string,
  tests: Array<(program: Program<TProgram>) => void>
) {
  describe(program_name, () => {
    const program = getTestProgram<TProgram>(program_name);
    tests.forEach((test) => test(program));
  });
}

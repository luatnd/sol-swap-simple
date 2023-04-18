import {Program} from "@project-serum/anchor";
import {assert} from "chai";
import {SimpleLiquidityPool} from "../../../../../target/types/simple_liquidity_pool";
import {getProgramConstant, getProgramIdlConstant} from "../../../../../tests/helpers/test-env";
import {IDL as MoveTokenIdl} from "../../../../../target/types/move_token";
import fs from "fs";

export function getThisProgramConstants(program: Program<SimpleLiquidityPool>) {
  const LP_SEED_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_SEED_PREFIX", program)), "utf8");
  assert(LP_SEED_PREFIX.toString().length > 0, "LP_FEE_SEED_PREFIX empty")

  const LP_LIQUIDITY_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_LIQUIDITY_PREFIX", program)), "utf8");
  assert(LP_LIQUIDITY_PREFIX.toString().length > 0, "LP_LIQUIDITY_PREFIX empty")

  const LP_FEE_SEED_PREFIX = Buffer.from(JSON.parse(getProgramConstant("LP_FEE_SEED_PREFIX", program)), "utf8");
  assert(LP_FEE_SEED_PREFIX.toString().length > 0, "LP_FEE_SEED_PREFIX empty")

  const LP_RATE_DECIMAL = parseInt(getProgramConstant("LP_RATE_DECIMAL", program));
  // expect(LP_RATE_DECIMAL).to.be.not.NaN.and.gt(0); // ==> This syntax has Bug in assertion
  assert(LP_RATE_DECIMAL > 0, "LP_RATE_DECIMAL must > 0");

  const LP_SWAP_FEE_PERMIL = parseInt(getProgramConstant("LP_SWAP_FEE_PERMIL", program));
  assert(LP_SWAP_FEE_PERMIL > 0, "LP_SWAP_FEE_PERMIL must > 0");

  const TOKEN_DECIMAL = parseInt(getProgramIdlConstant("TOKEN_DECIMAL", MoveTokenIdl));
  assert(TOKEN_DECIMAL > 0, "TOKEN_DECIMAL must > 0");

  return {
    LP_SEED_PREFIX,
    LP_LIQUIDITY_PREFIX,
    LP_FEE_SEED_PREFIX,
    LP_RATE_DECIMAL,
    LP_SWAP_FEE_PERMIL,
    TOKEN_DECIMAL,
  };
}


// contain some tmp generated stuff
const TMP_DIR = "tests/tmp";
type PrevLpPair = {
  // baseTokenPubKey: string, // base is SOL
  quoteTokenPubKey: string,
};

export function persistPrevLpPairToTmpData(content: PrevLpPair) {
  try {
    fs.mkdirSync(TMP_DIR, {recursive: true});
  } catch (e) {
  }
  fs.writeFileSync(`${TMP_DIR}/lp_pair.json`, JSON.stringify(content, null, 2));
}

export function getPrevLpPairFromTmpData(): PrevLpPair {
  let content;
  try {
    content = fs.readFileSync(`${TMP_DIR}/lp_pair.json`).toString();
  } catch (e) {
    content = `{}`
  }
  return JSON.parse(content);
}

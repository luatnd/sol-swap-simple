import {Cluster} from "@solana/web3.js";
import {Idl, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";

enum Site {
  SolScan,
  SolExplorer,
}
export function getExplorerUrlOfTx(tx: string, cluster: Cluster, site: Site = Site.SolScan) {
  switch (site) {
    case Site.SolScan:
      return `https://solscan.io/tx/${tx}?cluster=${cluster}`
    case Site.SolExplorer:
      return `https://explorer.solana.com/tx/${tx}?cluster=${cluster}`
    default:
      return '';
  }
}


export function getProgramConstant<T extends Idl>(constant_name: string, program: Program<T>): string {
  return getProgramIdlConstant(constant_name, program.idl);
}

export function getProgramIdlConstant(constant_name: string, idl: anchor.Idl): string {
  const constants = idl.constants.filter(i => i.name === constant_name);
  if (constants[0]) {
    return constants[0].value;
  }

  return undefined;
}

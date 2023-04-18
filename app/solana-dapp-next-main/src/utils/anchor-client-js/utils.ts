import {Cluster} from "@solana/web3.js";

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

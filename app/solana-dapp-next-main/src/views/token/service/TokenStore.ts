import {makeAutoObservable} from "mobx";

type TokenStoreType = {
  tokenName: string
  tokenSymbol: string
  tokenSupply: number
  metadataUri: string
}

class TokenStore implements TokenStoreType {
  metadataUri = "";
  tokenName = "";
  tokenSupply = 0;
  tokenSymbol = "";

  constructor() {
    makeAutoObservable(this)
  }

  set = (k: keyof TokenStoreType, v) => this[k as any] = v
}

const s = new TokenStore();
export default s;

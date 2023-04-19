import {makeAutoObservable} from "mobx";

type SwapStoreType = {
  lpAddr: string
  lpBalanceBase: number
  lpBalanceQuote: number
  userBalanceBase: number
  userBalanceQuote: number
}


// TODO: Perf: Fetch balance with rate limiter
class SwapStore implements SwapStoreType {
  lpAddr = "";
  lpBalanceBase = 0;
  lpBalanceQuote = 0;
  userBalanceBase = 0;
  userBalanceQuote = 0;

  constructor() {
    makeAutoObservable(this)
  }

  get lpBalance() {
    return {base: this.lpBalanceBase, quote: this.lpBalanceQuote}
  }

  get userBalance() {
    return {base: this.userBalanceBase, quote: this.userBalanceQuote}
  }

  set = (k: keyof SwapStoreType, v) => this[k as any] = v
  setState = (data: Record<keyof SwapStoreType, any>) => {
    const entries = Object.entries(data)
    for (let i = 0, c = entries.length; i < c; i++) {
      const entry = entries[i];
      this[entry[0] as any] = entry[1];
    }
  }
}

const s = new SwapStore();
export default s;

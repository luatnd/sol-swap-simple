# About
- Token mint demo
- Swap demo with fixed rate LP (not AMM)

Demo UI here: [https://solana-fixed-rate-swap.web.app/](https://solana-fixed-rate-swap.web.app/)

# Test
### Run all test
```
anchor test
```

### Run single test file
run test only inside `tests/tmp/tmp.ts`:
```
anchor run test-only -- tests/tmp/tmp.ts
```

### Run test for single program
```
# rebuild and deploy program IF needed (in terminal tab 2)
# This actually rebuild and redeploy the program
yarn redeploy-program move-token

# run test (in terminal tab 2)
anchor run test-program -- move-token
anchor run test-program -- simple-liquidity-pool

# Should not directly run via yarn because anchor run <sth> will do some more setting up
yarn test-program move-token
```

If /bin/sh does not support inline, you need to change yarn script shell to /bin/bash
> Change yarn script shell to /bin/bash to support inline function
> It's required to use inline function in yarn script.
> Yarn by default uses bin\sh, in which this particular inline Bash function cannot be run.
>
> ```
> yarn config set script-shell /bin/bash
> ```

# Rust unit test
TODO: Don't have time to write it but there was an example at:

# Common name in the code
- ATA: Associated Token Address (Token Account)
- TMA: Token Mint Address (Token Address, Mint, ...)

# Development
### BE
1. Deploy to devnet
Because we use metaplex so you either need to deploy mpl to localnet or using devnet
```
anchor build
anchor deploy
```

2. Run test in devnet
```
anchor run test
```

3. Sync the IDL to FE repos:
```
anchor build
yarn sync-output-to-fe
```

### FE
Remember to do "BE > Sync the IDL to FE repos" first to do some code gen for FE.

```
yarn dev
```

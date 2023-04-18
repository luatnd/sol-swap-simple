Flow:
- `anchor build`: build anchor programs
- `yarn sync-output-to-fe`: sync build output contain typescript code to this folder

Why we need to copy it here instead of directly import from target/types of anchor root folder?
- Because solana-dapp-next-main is a nextjs project, it can't import typescript code from outside of it's root folder

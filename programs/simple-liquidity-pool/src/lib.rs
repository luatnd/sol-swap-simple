use anchor_lang::prelude::*;

declare_id!("EETwc5hZxJsn4DYczvNupCnmDMwbCVb2YLFRQ7CWgEea");

#[program]
pub mod simple_liquidity_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

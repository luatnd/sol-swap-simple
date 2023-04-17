mod instructions;
mod state;
mod errors;

use anchor_lang::prelude::*;
use instructions::*; // Must import as * to avoid error

declare_id!("EETwc5hZxJsn4DYczvNupCnmDMwbCVb2YLFRQ7CWgEea");

#[program]
pub mod simple_liquidity_pool {
    use super::*;

    pub fn initialize(ctx: Context<LpInit>, fixed_rate: u32) -> Result<()> {
        init::init(ctx, fixed_rate)
    }
}

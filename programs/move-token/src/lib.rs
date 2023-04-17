use anchor_lang::prelude::*;

mod instructions;
mod errors;

use instructions::*; // Must import as * to avoid error
use crate::errors::*;

declare_id!("2simM1gHuCgquAVi2B1Q4baiU6UAxkNrrHEWkfcu3RaH");

#[program]
pub mod move_token {
  use super::*;

  pub fn create_token(
    ctx: Context<CreateTokenMint>,
    metadata_title: String,
    metadata_symbol: String,
    metadata_uri: String,
    initial_supply: u64,
    mint_authority_pda_bump: u8,
  ) -> Result<()> {
    create_token::create_token(
      ctx,
      metadata_title,
      metadata_symbol,
      metadata_uri,
      initial_supply,
      mint_authority_pda_bump,
    )
  }

  pub fn mint_to_another_wallet(
    ctx: Context<MintToAnotherWallet>,
    amount: u64,
    mint_authority_pda_bump: u8,
  ) -> Result<()> {
    require!(amount <= 1000 * 10_u64.pow(TOKEN_DECIMAL as u32), MoveTokenError::InvalidAirDropAmount);

    mint_to_another_wallet::mint_to_another_wallet(
      ctx,
      amount,
      mint_authority_pda_bump,
    )
  }
}

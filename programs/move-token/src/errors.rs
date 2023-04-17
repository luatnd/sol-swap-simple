use anchor_lang::prelude::*;

#[error_code]
pub enum MoveTokenError {
  #[msg("Uncategorized")]
  Uncategorized,
  #[msg("Cannot airdrop greater than 1000")]
  InvalidAirDropAmount,
}

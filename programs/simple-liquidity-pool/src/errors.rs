use anchor_lang::prelude::*;

#[error_code]
pub enum LpBaseError {
  #[msg("Fixed rate must be > 0")]
  InvalidRate,
  #[msg("Amount must be >= 0")]
  InvalidAmount,
}

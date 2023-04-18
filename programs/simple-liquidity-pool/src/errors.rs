use anchor_lang::prelude::*;

#[error_code]
pub enum LpBaseError {
  #[msg("Fixed rate must be > 0")]
  InvalidRate,
  #[msg("Amount must be >= 0")]
  InvalidAmount,
  #[msg("Amount must be > 0")]
  InvalidSwapAmount,
  #[msg("Swap amount too large, plz try with smaller amount")]
  LargeSwapAmount,
  #[msg("Token must be base or quote of this pool")]
  InvalidSwapToken,
  #[msg("Quote amount is insufficient, please ask LP provider for adding more liquidity")]
  InsufficientQuoteAmount,
  #[msg("Base amount is insufficient, please ask LP provider for adding more liquidity")]
  InsufficientBaseAmount,
}

use anchor_lang::prelude::*;
use crate::errors::LpBaseError;

///
/// this LP is for <Sol, SplToken>
/// base token is hard coded to SOL
///
/// If we need to swap <Sol/SplToken, Sol/SplToken>,
/// We need to use WRAPPED SOL,
///
/// which is not a requirement of this test
/// So I skip it for now
///
/// Base: SOL
/// Quote: SPL token
///
/// Base,Quote is a term in trading that represents the BASE/QUOTE trading pair
///
#[account]
#[derive(Default)]
pub struct FixedRateLP {
  /// 1 base = ? quote
  /// if 1 base = 10 quote then rate = 10,000 because of RATE_DECIMAL=3
  /// max rate = 2^(32-RATE_DECIMAL)
  pub rate: u32,            // 4

  /// NOTE: base & quote is a term in the stock & forex market
  /// base token is hardcoded to be native SOL
  /// quote token is your token, eg: MOVE
  /// the LP symbol would be: SOL/MOVE pool
  pub token_base: Pubkey,   // 32
  pub token_quote: Pubkey,  // 32

  // pub liquidity: Pubkey,    // 32
  // pub fee: Pubkey,          // 32
  // pub liquidity_quote_ata: Pubkey, // 32
  // pub fee_quote_ata: Pubkey, // 32

  // NOTE: At this time: we read balance inside amount_base_ATA as the single source of truth
  // For better performance, need another complex implementation, such as cache the balance here
  // pub amount_base: u128,    // 16: current base token amount in this pool
  // pub amount_quote: u128,   // 16

  // profit tracking for all liquidity provider: Ignore this feature

  // misc
  pub bump: u8,                 // 1
  pub liquidity_bump: u8,       // 1
  pub fee_bump: u8,             // 1
}


// pub enum LpType {
//   FixedRate, // 1A always = nB, n is fixed
//   ConstantProduct, // AMM
// }
pub enum SwapDir {
  BaseToQuote,
  QuoteToBase,
}

impl FixedRateLP {
  // pub const SEED_PREFIX: &'static [u8] = b"FixedRateLP_";
  pub const MAXIMUM_SIZE: usize = 4 + 32 + 32 + 1 + 1 + 1;
}


//
// Mark as constant to Expose to Idl
// constant macro inside struct scope will not be exposed to Idl
//
#[constant]
pub const LP_SEED_PREFIX: &[u8] = b"FixedRateLP_";
#[constant]
pub const LP_LIQUIDITY_PREFIX: &[u8] = b"FixedRateLP_liquid_";
#[constant]
pub const LP_FEE_SEED_PREFIX: &[u8] = b"FixedRateLP_fee_";
#[constant]
pub const LP_RATE_DECIMAL: u8 = 3;

/// Swap fee will be deducted directly on to_amount, not from_amount
#[constant]
pub const LP_SWAP_FEE_PERMIL: u8 = 50; // 50/1000 = 5.0%


// impl LP for FixedRateLP {
impl FixedRateLP {
  pub fn init(
    &mut self,
    token_base: Pubkey, token_quote: Pubkey,
    fixed_rate: u32,
    bump: u8, liquidity_bump: u8, fee_bump: u8,
  ) -> Result<()> {
    require_gt!(fixed_rate, 0, LpBaseError::InvalidRate);
    require!(fixed_rate <= 2_u32.pow(32 - LP_RATE_DECIMAL as u32), LpBaseError::InvalidRate);

    self.rate = fixed_rate;
    self.token_base = token_base;
    self.token_quote = token_quote;
    self.bump = bump;
    self.liquidity_bump = liquidity_bump;
    self.fee_bump = fee_bump;

    Ok(())
  }
}


// #[cfg(test)]
// mod tests {
//   #[test]
//   fn exploration() {
//     assert_eq!(2 + 2, 4);
//   }
// }

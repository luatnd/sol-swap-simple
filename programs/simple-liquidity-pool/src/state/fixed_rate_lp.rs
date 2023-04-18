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


impl FixedRateLP {
  // pub const SEED_PREFIX: &'static [u8] = b"FixedRateLP_";
  pub const MAXIMUM_SIZE: usize = 4 + 32 + 32 + 1 + 1 + 1;

  pub fn get_swap_dir(&self, from_token: Pubkey, to_token: Pubkey) -> Option<SwapDir> {
    let mut swap_dir: Option<SwapDir> = None;
    // if from_token is base token and to_token is quote token then swap_dir=BaseToQuote
    if from_token == self.token_base && to_token == self.token_quote {
      swap_dir = Option::from(SwapDir::BaseToQuote)
    } else if from_token == self.token_quote && to_token == self.token_base {
      swap_dir = Option::from(SwapDir::QuoteToBase)
    }

    swap_dir
  }
}


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

  /// No logic yet because this lp is simple, but let it here to validate.
  /// Or just remove this fn is oke
  pub fn add_liquidity(&mut self, token_base_amount: u64, token_quote_amount: u64) -> Result<()> {
    require_gte!(token_base_amount, 0, LpBaseError::InvalidAmount);
    require_gte!(token_quote_amount, 0, LpBaseError::InvalidAmount);

    // TODO: Validate current amount over upper range of u64

    // self.amount_base += token_base_amount;
    // self.amount_quote += token_quote_amount;

    Ok(())
  }

  ///
  /// Return (
  ///   SwapDir,
  ///   from_amount: base token change amount,
  ///   to_amount_without_fee: quote token change amount,
  ///   fee: the fee deducted on to_amount,
  /// )
  ///
  pub fn preview_swap(
    &mut self,
    from_token: Pubkey,
    to_token: Pubkey,
    from_amount: u64,
    current_base_liquidity: u64,
    current_quote_liquidity: u64,
  ) -> Result<(SwapDir, u64, u64, u64)> {
    require_gt!(from_amount, 0, LpBaseError::InvalidSwapAmount);

    let swap_direction = self.get_swap_dir(from_token, to_token);
    require!(swap_direction.is_some(), LpBaseError::InvalidSwapToken);

    let swap_dir = swap_direction.unwrap();
    // let (current_base_liquidity, current_quote_liquidity) = FixedRateLP::get_current_liquidity();

    let verbose = false;
    if verbose { msg!("[preview_swap] current base, quote liquidity: {}, {}", current_base_liquidity, current_quote_liquidity); }

    let rate: f64 = self.rate as f64 / 1000_f64;
    if verbose { msg!("[preview_swap] rate: {}", rate); }

    let to_amount = match swap_dir {
      SwapDir::BaseToQuote => {
        let to_amount = (from_amount as f64 * rate) as u64;
        require!(to_amount <= current_quote_liquidity, LpBaseError::InsufficientQuoteAmount);
        to_amount
      },
      SwapDir::QuoteToBase => {
        let to_amount = (from_amount as f64 / rate) as u64;
        require!(to_amount <= current_base_liquidity, LpBaseError::InsufficientBaseAmount);
        to_amount
      }
    };
    if verbose { msg!("[preview_swap] to_amount: {}", to_amount); }

    let fee = FixedRateLP::get_swap_fee(to_amount);

    Ok((swap_dir, from_amount, to_amount, fee))
  }

  fn get_swap_fee(to_amount: u64) -> u64 {
    return to_amount * (LP_SWAP_FEE_PERMIL as u64) / 1000;
  }

  // /// @return (current_base_amount_available, current_quote_amount_available)
  // fn get_current_liquidity() -> (u64, u64) {
  //   return (0, 0);
  //   // todo!()
  // }
}


// #[cfg(test)]
// mod tests {
//   #[test]
//   fn exploration() {
//     assert_eq!(2 + 2, 4);
//   }
// }

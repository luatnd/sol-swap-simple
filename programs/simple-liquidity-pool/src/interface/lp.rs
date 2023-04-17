// use anchor_lang::prelude::*;

// /// Interface for some LP type
// pub trait LP {
//   fn init(&mut self, token_base: Pubkey, token_quote: Pubkey, fixed_rate: u32) -> Result<()>;
//   fn add_liquidity(&mut self, token_base_amount: u128, token_quote_amount: u128) -> Result<()>;
//   fn get_swap_data(&mut self, from_token: Pubkey, to_token: Pubkey, from_amount: u128) -> Result<(u128, u128, u128)>;
//   // fn swap_exact_base_to_quote(&self) -> u64;
//   // fn swap_exact_quote_to_base(&self) -> u64;
//
//   fn get_swap_fee(to_amount: u128) -> u128;
//   fn get_current_liquidity() -> (u128, u128);
// }

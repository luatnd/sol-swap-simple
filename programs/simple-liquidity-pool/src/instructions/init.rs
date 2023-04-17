use anchor_lang::prelude::*;
use anchor_spl::{
  token,
  token::spl_token,
  associated_token,
};
use crate::state::{FixedRateLP, LP_SEED_PREFIX, LP_LIQUIDITY_PREFIX, LP_FEE_SEED_PREFIX};


pub fn init(ctx: Context<LpInit>, fixed_rate: u32) -> Result<()> {
  let lp = &mut ctx.accounts.lp;
  // msg!("Initializing liquidity pool {:?}", lp);

  let lp_bump = *ctx.bumps.get("lp").unwrap();
  let lp_liquidity_bump = *ctx.bumps.get("lp_liquidity").unwrap();
  let lp_fee_bump = *ctx.bumps.get("lp_fee").unwrap();
  lp.init(
    spl_token::native_mint::id(),
    ctx.accounts.token_quote.key(),
    fixed_rate,
    lp_bump,
    lp_liquidity_bump,
    lp_fee_bump,
  )?;

  Ok(())
}


#[derive(Accounts)]
pub struct LpInit<'info> {
  // lp state data
  #[account(
    init,
    payer = user,
    space = 8 + FixedRateLP::MAXIMUM_SIZE,
    seeds = [
      LP_SEED_PREFIX,
      token_quote.key().as_ref()
    ],
    bump,
  )]
  pub lp: Account<'info, FixedRateLP>,

  // base Token Mint Address: Read more in README.md
  // #[account()] // base is hardcoded to SOL
  // pub token_base: Account<'info, token::Mint>,
  #[account()]
  pub token_quote: Account<'info, token::Mint>,


  // lp liquidity: store SOL liquidity
  // `lp` account is state, contain data so cannot be used as SOL sender
  /// CHECK: Just to store SOL
  #[account(
    init,
    payer = user,
    space = 8 + 8,
    seeds = [
      LP_LIQUIDITY_PREFIX,
      token_quote.key().as_ref()
    ],
    bump,
  )]
  pub lp_liquidity: UncheckedAccount<'info>,

  // lp liquidity: store SPL liquidity
  #[account(
    init,
    payer = user,
    associated_token::mint = token_quote,
    associated_token::authority = lp_liquidity,
  )]
  pub lp_liquidity_quote_ata: Account<'info, token::TokenAccount>,

  // lp fee: store SOL fee collected, for profit sharing later
  /// CHECK: Just to store SOL
  #[account(
    init,
    payer = user,
    space = 8 + 8,
    seeds = [LP_FEE_SEED_PREFIX, token_quote.key().as_ref()],
    bump,
  )]
  pub lp_fee: UncheckedAccount<'info>,

  // lp fee: store SPL fee collected, for profit sharing later
  #[account(
    init,
    payer = user,
    associated_token::mint = token_quote,
    associated_token::authority = lp_fee,
  )]
  pub lp_fee_quote_ata: Account<'info, token::TokenAccount>,


  #[account(mut)]
  pub user: Signer<'info>,

  pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, token::Token>,
  pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

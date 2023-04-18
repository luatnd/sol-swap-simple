use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
  token,
  token::spl_token,
  associated_token,
};
use crate::state::{FixedRateLP, LP_SEED_PREFIX, LP_LIQUIDITY_PREFIX};

pub fn add_liquidity(
  ctx: Context<LpAddLiquidity>,
  base_amount: u64,
  quote_amount: u64,
) -> Result<()> {
  let lp = &mut ctx.accounts.lp;
  lp.add_liquidity(base_amount, quote_amount)?;

  if base_amount > 0 {
    transfer_token_into_pool(&ctx, spl_token::native_mint::id(), base_amount)?;
  }
  if quote_amount > 0 {
    transfer_token_into_pool(&ctx, ctx.accounts.token_quote.key(), quote_amount)?;
  }

  Ok(())
}


#[derive(Accounts)]
pub struct LpAddLiquidity<'info> {
  // lp state data
  #[account(
    mut,
    seeds = [
      LP_SEED_PREFIX,
      token_quote.key().as_ref()
    ],
    bump = lp.bump,
  )]
  pub lp: Account<'info, FixedRateLP>,

  #[account(mut)]
  pub token_quote: Account<'info, token::Mint>,


  // lp liquidity: store SOL liquidity
  // `lp` account is state, contain data so cannot be used as SOL sender
  /// CHECK: will handle validation in code if needed
  #[account(
    mut,
    seeds = [
      LP_LIQUIDITY_PREFIX,
      token_quote.key().as_ref()
    ],
    bump = lp.liquidity_bump,
  )]
  pub lp_liquidity: UncheckedAccount<'info>,

  // lp liquidity: store SPL liquidity
  #[account(
    mut,
    associated_token::mint = token_quote,
    associated_token::authority = lp_liquidity,
  )]
  pub lp_liquidity_quote_ata: Account<'info, token::TokenAccount>,

  #[account(
    init_if_needed,
    payer = user,
    associated_token::mint = token_quote,
    associated_token::authority = user,
  )]
  pub user_quote_ata: Account<'info, token::TokenAccount>,


  #[account(mut)]
  pub user: Signer<'info>,

  // pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, token::Token>,
  pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}


///
/// Transfer token from user wallet into pool
///
fn transfer_token_into_pool<'info>(
  ctx: &Context<LpAddLiquidity<'info>>,
  for_token: Pubkey,
  amount: u64,
) -> Result<()> {
  msg!("[transfer_token_into_pool] Transferring {} {} tokens ...", amount, for_token.key().to_string());

  let is_native_and_base_token = for_token == spl_token::native_mint::id();

  if is_native_and_base_token {
    // case native SOL
    system_program::transfer(
      CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
          from: ctx.accounts.user.to_account_info(),
          to: ctx.accounts.lp_liquidity.to_account_info(),
        },
      ),
      amount,
    )
  } else {
    // case SPL token
    token::transfer(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
          from: ctx.accounts.user_quote_ata.to_account_info(),
          to: ctx.accounts.lp_liquidity_quote_ata.to_account_info(),
          authority: ctx.accounts.user.to_account_info(),
        },
      ),
      amount,
    )
  }
}

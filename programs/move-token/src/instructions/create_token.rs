use anchor_lang::{
  prelude::*,
  solana_program::program::invoke_signed,
};
use anchor_spl::{
  token,
  associated_token,
};
use mpl_token_metadata::{
  instruction as mpl_instruction,
};

#[constant]
pub const TOKEN_DECIMAL: u8 = 9;

#[constant]
pub const MINT_AUTH_SEED_PREFIX: &[u8] = b"mint_authority_";


pub fn create_token(
  ctx: Context<CreateTokenMint>,
  title: String,
  symbol: String,
  metadata_uri: String,
  initial_supply: u64, // amount in token units
  mint_authority_pda_bump: u8,
) -> Result<()> {
  msg!("[move_token.create_token] Metadata account address: {}", &ctx.accounts.metadata_account.key());

  mint_to_payer_wallet(
    &ctx,
    initial_supply,
    mint_authority_pda_bump,
  )?;
  msg!("[move_token.create_token] Mint Supply Done");

  // let metadata_account = ctx.accounts.metadata_account.to_account_info();
  // msg!("[move_token.create_token] Metadata account: {:?}", metadata_account);
  // let token_metadata_program = &ctx.accounts.token_metadata_program;
  // msg!("[move_token.create_token] token_metadata_program: {:?}", token_metadata_program);

  // More detail: https://docs.metaplex.com/programs/token-metadata/instructions
  // Cross Program Call Depth index: 0
  let ix = mpl_instruction::create_metadata_accounts_v3(
    ctx.accounts.token_metadata_program.key(),
    ctx.accounts.metadata_account.key(),
    ctx.accounts.mint_account.key(),
    ctx.accounts.mint_authority.key(),
    ctx.accounts.payer.key(),
    ctx.accounts.mint_authority.key(),
    title,
    symbol,
    metadata_uri,
    None,
    0,
    true, // True if an Instruction requires a Transaction signature matching pubkey.
    true, // metadata can be modify later on
    None,
    None,
    None,
  );
  let accounts = [
    ctx.accounts.metadata_account.to_account_info(),
    ctx.accounts.mint_account.to_account_info(),
    ctx.accounts.mint_authority.to_account_info(),   // Mint Authority
    ctx.accounts.payer.to_account_info(),   // payer
    ctx.accounts.mint_authority.to_account_info(),   // Update Authority
    ctx.accounts.system_program.to_account_info(),
    ctx.accounts.rent.to_account_info(),
  ];

  let binding = ctx.accounts.mint_account.key();
  let seeds: &[&[&[u8]]] = &[&[
    MINT_AUTH_SEED_PREFIX,
    &binding.as_ref(),
    &[mint_authority_pda_bump],
  ]];

  invoke_signed(&ix, &accounts, seeds)?;

  msg!("[move_token.create_token] Init Done");

  Ok(())
}

// private function
fn mint_to_payer_wallet(
  ctx: &Context<CreateTokenMint>,
  initial_supply: u64, // amount in lamport units, not in token
  mint_authority_pda_bump: u8,
) -> Result<()> {
  //
  // Mint initial supply to payer wallet right after init
  //
  msg!("Token Address: {}", ctx.accounts.payer_ata.key());
  token::mint_to(
    CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      token::MintTo {
        mint: ctx.accounts.mint_account.to_account_info(),
        to: ctx.accounts.payer_ata.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
      },
      &[&[
        MINT_AUTH_SEED_PREFIX,
        ctx.accounts.mint_account.key().as_ref(),
        &[mint_authority_pda_bump],
      ]]
    ),
    initial_supply,
  )?;

  Ok(())
}


#[derive(Accounts)]
pub struct CreateTokenMint<'info> {
  #[account(
    init,
    payer = payer,
    mint::decimals = TOKEN_DECIMAL,
    mint::authority = mint_authority.key(),
  )]
  pub mint_account: Account<'info, token::Mint>,

  #[account(
    init,
    payer = payer,
    space = 8,
    seeds = [
      MINT_AUTH_SEED_PREFIX,
      mint_account.key().as_ref(),
    ],
    bump
  )]
  pub mint_authority: Account<'info, MintAuthorityPda>,

  // use for minting some token payer right after init mint
  #[account(
    init,
    payer = payer,
    associated_token::mint = mint_account,
    associated_token::authority = payer,
  )]
  pub payer_ata: Account<'info, token::TokenAccount>,

  #[account(mut)]
  pub payer: Signer<'info>,
  pub rent: Sysvar<'info, Rent>,

  /// _CHECK: We're about to create this with Metaplex
  #[account(mut)]
  pub metadata_account: UncheckedAccount<'info>,

  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, token::Token>,
  /// _CHECK: Metaplex will check this
  pub token_metadata_program: UncheckedAccount<'info>,
  pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

#[account]
pub struct MintAuthorityPda {}

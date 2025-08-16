use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token_2022::MintTo, token_interface::{self, Mint, TokenAccount, TokenInterface}};

use crate::{Identity, CreatorToken};

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct CreateCreatorToken<'info> {
    #[account(mut)]
    pub creator : Signer<'info>,

    #[account(seeds=[b"identity", creator.key().as_ref()], bump=identity_proof.bump)]
    pub identity_proof : Account<'info, Identity>,

    #[account(
        init, 
        payer=creator, 
        seeds=[b"creator_token", identity_proof.key().as_ref()], 
        space=8+CreatorToken::INIT_SPACE, bump
    )]
    pub creator_token : Account<'info, CreatorToken>,

    #[account(
        init,
        payer = creator,
        mint::decimals = decimals,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [b"owner", identity_proof.key().as_ref()],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    // PDA that will act as mint & freeze authority (per-mint flavor).
    #[account(seeds=[b"mint_authority"], bump)]
    pub mint_authority: SystemAccount<'info>,

    // Creator's ATA for this mint (where we can send the initial supply)
    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: InterfaceAccount<'info, TokenAccount>,

    // Create Vault
    #[account(seeds=[b"vault", identity_proof.key().as_ref()], bump)]
    pub vault : SystemAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program : Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,  
}

pub fn handler(ctx: Context<CreateCreatorToken>, decimals : u8, inital_supply: u64) -> Result<()> {
    // Set initial supply
    if inital_supply > 0 {
        // mint initial_supply to creator_ata

        let cpi_accounts = MintTo {
            authority: ctx.accounts.mint_authority.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.creator_ata.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let mint_authority_seeds: &[&[&[u8]]]=  &[&[b"mint_authority", &[ctx.bumps.mint_authority]]];

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, mint_authority_seeds);
        token_interface::mint_to(cpi_context, inital_supply)?;
    }

    // May be changed in the future
    // Set creator_token data in PDA
    ctx.accounts.creator_token.creator_wallet = ctx.accounts.creator.key();
    ctx.accounts.creator_token.mint = ctx.accounts.mint.key();
    ctx.accounts.creator_token.vault = ctx.accounts.vault.key();
    ctx.accounts.creator_token.base_price = 1111111; // TBD | Base price - The starting price per token when supply is at 0
    ctx.accounts.creator_token.slope = 1111; // TBD | The incremental price increase per additional token minted (rate of increase).
    ctx.accounts.creator_token.total_supply = inital_supply;
    ctx.accounts.creator_token.created_at = Clock::get()?.unix_timestamp;
    ctx.accounts.creator_token.bump = ctx.bumps.creator_token;
    ctx.accounts.creator_token.mint_authority_bump = ctx.bumps.mint_authority;

    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::{ associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface}};

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
    /// CHECK: signer-only PDA; no data stored
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
    

    Ok(())
}

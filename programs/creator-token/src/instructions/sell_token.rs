use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{CreatorToken, Identity};

#[derive(Accounts)]
pub struct SellToken<'info> {
    // seller
    pub seller : Signer<'info>,

    /// CHECK: Needed to derive proper accounts for validation
    pub creator : AccountInfo<'info>,

    // seller ata 
    #[account(
        mut,
        associated_token::mint=mint,
        associated_token::authority=seller,
        associated_token::token_program = token_program
    )]
    pub seller_ata : InterfaceAccount<'info, TokenAccount>,

    // identity proof
    #[account(seeds=[b"identity", creator.key().as_ref()], bump=identity_proof.bump)]
    pub identity_proof : Account<'info, Identity>,

    #[account(
        seeds=[b"creator_token", identity_proof.key().as_ref()], 
        // has_one=mint,
        // has_one=vault,
        // has_one=creator,
        bump=creator_token.bump
    )]
    pub creator_token : Account<'info, CreatorToken>,

    // mint authority
    #[account(seeds=[b"mint_authority"], bump=creator_token.mint_authority_bump)]
    pub mint_authority: SystemAccount<'info>,

    // mint
    #[account(
        mint::authority=mint_authority,
        mint::freeze_authority=mint_authority,
        seeds=[b"owner", identity_proof.key().as_ref()],
        bump=creator_token.mint_bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    // token vault
    #[account(
        mut,
        seeds=[b"vault", identity_proof.key().as_ref()],
        bump=creator_token.vault_bump
    )]
    pub vault : SystemAccount<'info>,

    pub token_program : Interface<'info, TokenInterface>,
    pub system_program : Program<'info, System>
    
}

pub fn handler(ctx: Context<SellToken>, tokens_to_sell: u64) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}

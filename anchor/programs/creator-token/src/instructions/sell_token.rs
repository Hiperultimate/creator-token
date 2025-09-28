use anchor_lang::prelude::*;
use anchor_spl::{token_2022::{burn, Burn}, token_interface::{Mint, TokenAccount, TokenInterface}};
use anchor_lang::{
    system_program::{transfer, Transfer},
};

use crate::{helpers::{get_selling_return}, CreatorToken, Identity};

#[derive(Accounts)]
pub struct SellToken<'info> {
    // seller
    #[account(mut)]
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
        mut,
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
    
    // burn tokens from seller_ata
    let required_accounts = Burn {
        authority: ctx.accounts.seller.to_account_info(),
        from: ctx.accounts.seller_ata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info()
    };
    let cpi_context_burn = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    required_accounts
    );
    burn(cpi_context_burn, tokens_to_sell)?;

    // calculate cost for the tokens burned
    let current_supply: u64 = ctx.accounts.mint.supply;
    let base_price: u64 = ctx.accounts.creator_token.base_price;
    let slope: u64 = ctx.accounts.creator_token.slope;
    let decimals: u8 = ctx.accounts.mint.decimals;  
    let token_cost : u64 = get_selling_return(
        tokens_to_sell,              // base units (u64)
        current_supply,             // base units (u64)
        base_price,                 // lamports per whole token (u64)
        slope,                      // lamports per whole token (u64)
        decimals                    // decimals (u8)
    )?;

    // msg!("CHECKING TOKEN COST : {}", token_cost);
    
    // transfer equivalent lamports from vault to signer
    let transfer_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.seller.to_account_info()
    };
    let identity_proof_key = ctx.accounts.identity_proof.key();
    let transfer_signing_seeds: &[&[&[u8]]] = &[&[b"vault", identity_proof_key.as_ref(), &[ctx.accounts.creator_token.vault_bump]]];
    let cpi_context_transfer = CpiContext::new_with_signer(ctx.accounts.system_program.to_account_info(), transfer_accounts,transfer_signing_seeds);
    transfer( cpi_context_transfer , token_cost)

    // Ok(())
}

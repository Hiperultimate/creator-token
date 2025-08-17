use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{helpers::get_buying_cost, CreatorToken, Identity};

#[derive(Accounts)]
pub struct TokenPrice<'info> {
    /// CHECK: Needed to derive proper accounts for validation
    pub creator : AccountInfo<'info>,

    #[account(seeds=[b"identity", creator.key().as_ref()], bump=identity_proof.bump)]
    pub identity_proof : Account<'info, Identity>,

    #[account(
        seeds=[b"creator_token", identity_proof.key().as_ref()], 
        bump=creator_token.bump
    )]
    pub creator_token : Account<'info, CreatorToken>,

    #[account(seeds=[b"mint_authority"], bump=creator_token.mint_authority_bump)]
    pub mint_authority: SystemAccount<'info>,

    #[account(
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [b"owner", identity_proof.key().as_ref()],
        bump=creator_token.mint_bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,
}

pub fn handler(ctx: Context<TokenPrice>, tokens_to_buy: u64) -> Result<u64> {
    let current_supply: u64 = ctx.accounts.mint.supply;
    let base_price: u64 = ctx.accounts.creator_token.base_price;
    let slope: u64 = ctx.accounts.creator_token.slope;
    let decimals: u8 = ctx.accounts.mint.decimals;  
    let total_price: u64 = get_buying_cost(
        tokens_to_buy,              // base units (u64)
        current_supply,             // base units (u64)
        base_price,                 // lamports per whole token (u64)
        slope,                      // lamports per whole token (u64)
        decimals                    // decimals (u8)
    )?;

    msg!("Checking price in blockchain : {} ", total_price);
    Ok(total_price)
}

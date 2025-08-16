use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use anchor_spl::{associated_token::AssociatedToken, token_2022::MintTo, token_interface::{self, Mint, TokenAccount, TokenInterface}};

use crate::{error::CustomError, CreatorToken, Identity};

#[derive(Accounts)]
pub struct BuyToken<'info> {
    #[account(mut)]
    pub buyer : Signer<'info>,

    /// CHECK: Needed to derive proper accounts for validation
    pub creator : AccountInfo<'info>,

    #[account(seeds=[b"identity", creator.key().as_ref()], bump=identity_proof.bump)]
    pub identity_proof : Account<'info, Identity>,

    #[account(seeds=[b"vault", identity_proof.key().as_ref()], bump)]
    pub vault : SystemAccount<'info>,

    #[account(
        seeds=[b"creator_token", identity_proof.key().as_ref()], 
        bump=creator_token.bump
    )]
    pub creator_token : Account<'info, CreatorToken>,

    #[account(
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [b"owner", identity_proof.key().as_ref()],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(seeds=[b"mint_authority"], bump=creator_token.mint_authority_bump)]
    pub mint_authority: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer=buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program
    )]
    pub buyer_ata: InterfaceAccount<'info, TokenAccount>,

    pub system_program : Program<'info, System>,
    pub token_program : Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,

}

pub fn handler(ctx: Context<BuyToken>, tokens_to_buy: u64) -> Result<()> {
    // calculate tokens to send
    let current_supply = ctx.accounts.mint.supply;
    let base_price = ctx.accounts.creator_token.base_price;
    let slope = ctx.accounts.creator_token.slope;
    let total_price = get_buying_cost(
        tokens_to_buy,
        current_supply,
        base_price as u128,
        slope as u128
    )?;

    // Store the received lamports to vault
    let accounts = Transfer { 
        from : ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let context = CpiContext::new(ctx.accounts.system_program.to_account_info(), accounts );
    transfer(context, total_price)?;

    // cpi the creator tokens to the user
    let program = ctx.accounts.token_program.to_account_info();
    let accounts = MintTo {
        authority : ctx.accounts.mint_authority.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.buyer_ata.to_account_info(),
    };
    let buyer_seeds: &[&[&[u8]]] = &[&[b"mint_authority", &[ctx.accounts.creator_token.mint_authority_bump]]];
    let cpi_context = CpiContext::new_with_signer(program, accounts, buyer_seeds);
    token_interface::mint_to(cpi_context,tokens_to_buy)
}

const PRICE_PRECISION: u128 = 1_000_000_000; // e.g., 1e9 fixed point scale

fn get_buying_cost(
    tokens_to_buy: u64,
    current_supply: u64,
    base_price: u128, // base price scaled by PRICE_PRECISION
    slope: u128,      // slope scaled by PRICE_PRECISION
) -> Result<u64> {
    // Formula being used
    // let total_cost = base_token_price * tokens_to_buy + slope * (current_supply * tokens_to_buy + (tokens_to_buy * tokens_to_buy) / 2);

    let t: u128 = tokens_to_buy as u128;
    let s0 = current_supply as u128;

    // Compute (s0 * t) and (t^2 / 2), safely
    let s0_t = s0.checked_mul(t).ok_or(error!(CustomError::MathOverflow))?;
    let t2_half = t.checked_mul(t).ok_or(error!(CustomError::MathOverflow))?
                    .checked_div(2).ok_or(error!(CustomError::MathOverflow))?;

    // total_term = s0*t + t^2/2
    let total_term = s0_t.checked_add(t2_half).ok_or(error!(CustomError::MathOverflow))?;

    // cost_fp = base_price * t + slope * total_term
    let part1 = base_price.checked_mul(t).ok_or(error!(CustomError::MathOverflow))?;
    let part2 = slope.checked_mul(total_term).ok_or(error!(CustomError::MathOverflow))?;
    let total_fp = part1.checked_add(part2).ok_or(error!(CustomError::MathOverflow))?;

    // Convert from fixed-point to actual units (u64)
    let cost = total_fp.checked_div(PRICE_PRECISION).ok_or(error!(CustomError::MathOverflow))?;
    let cost_u64 = cost.try_into().map_err(|_| error!(CustomError::MathOverflow))?;

    Ok(cost_u64)
}


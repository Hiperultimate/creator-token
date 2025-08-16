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

    #[account(mut, seeds=[b"vault", identity_proof.key().as_ref()], bump)]
    pub vault : SystemAccount<'info>,

    #[account(
        seeds=[b"creator_token", identity_proof.key().as_ref()], 
        bump=creator_token.bump
    )]
    pub creator_token : Account<'info, CreatorToken>,

    #[account(
        mut,
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
    let mint_authority_seeds: &[&[&[u8]]]=  &[&[b"mint_authority", &[ctx.accounts.creator_token.mint_authority_bump]]];
    
    let cpi_context = CpiContext::new_with_signer(program, accounts, mint_authority_seeds);
    token_interface::mint_to(cpi_context,tokens_to_buy)
}

fn get_buying_cost(
    tokens_to_buy_base: u64,    // base units (e.g., 25.6123 tokens => 256123 if decimals=4)
    current_supply_base: u64,   // base units
    base_price_per_token: u64,  // lamports per whole token (integer)
    slope_per_token: u64,       // lamports per whole token (integer)
    decimals: u8,               // mint.decimals
) -> Result<u64> {
    // convert inputs to u128 for intermediate arithmetic safety
    let d: u128 = 10u128.checked_pow(decimals as u32).ok_or(error!(CustomError::MathOverflow))?;
    let d2 = d.checked_mul(d).ok_or(error!(CustomError::MathOverflow))?;

    let t: u128 = tokens_to_buy_base as u128;
    let s0: u128 = current_supply_base as u128;
    let b: u128 = base_price_per_token as u128;
    let m: u128 = slope_per_token as u128;

    // numerator = b * t * D  +  m * s0 * t  +  m * (t^2 / 2)
    // (see derivation in discussion: cost = [b*t*D + m*(s0*t + t^2/2)] / D^2)
    let term1 = b.checked_mul(t).and_then(|x| x.checked_mul(d)).ok_or(error!(CustomError::MathOverflow))?;
    let term2 = m.checked_mul(s0).and_then(|x| x.checked_mul(t)).ok_or(error!(CustomError::MathOverflow))?;
    let t2_half = t.checked_mul(t).ok_or(error!(CustomError::MathOverflow))?
                    .checked_div(2).ok_or(error!(CustomError::MathOverflow))?;
    let term3 = m.checked_mul(t2_half).ok_or(error!(CustomError::MathOverflow))?;

    let numer = term1.checked_add(term2).and_then(|x| x.checked_add(term3)).ok_or(error!(CustomError::MathOverflow))?;
    let cost = numer.checked_div(d2).ok_or(error!(CustomError::MathOverflow))?;

    // downcast to u64 (fail if overflow)
    let cost_u64: u64 = cost.try_into().map_err(|_| error!(CustomError::MathOverflow))?;
    Ok(cost_u64)
}

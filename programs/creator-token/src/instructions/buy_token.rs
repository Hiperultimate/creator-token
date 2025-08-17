use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use anchor_spl::{
    associated_token::AssociatedToken, 
    token_2022::MintTo, token_interface::{self, Mint, TokenAccount, TokenInterface}
};

use crate::{
    helpers::get_buying_cost::get_buying_cost,
    CreatorToken, 
    Identity
};

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
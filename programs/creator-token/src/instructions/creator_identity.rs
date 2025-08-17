use anchor_lang::prelude::*;

use crate::{error::IdentityError, Identity};

#[derive(Accounts)]
pub struct CreatorIdentity<'info> {
    #[account(mut)]
    pub creator : Signer<'info>,

    #[account(init, payer=creator, seeds=[b"identity", creator.key().as_ref()], space=8+Identity::INIT_SPACE, bump)]
    pub identity_proof : Account<'info, Identity>,

    pub system_program : Program<'info, System>
}

pub fn handler(ctx: Context<CreatorIdentity>, user_name : String, proof_url : String) -> Result<()> {
    require!(user_name.len() <= 50, IdentityError::NameTooLong);
    require!(proof_url.len() <= 200, IdentityError::UrlTooLong);

    ctx.accounts.identity_proof.creator = ctx.accounts.creator.key();
    ctx.accounts.identity_proof.creator_name = user_name;
    ctx.accounts.identity_proof.proof_url = proof_url;
    ctx.accounts.identity_proof.bump = ctx.bumps.identity_proof;

    Ok(())
}

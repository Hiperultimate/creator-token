use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Identity{
    pub creator_wallet : Pubkey,

    #[max_len(50)]
    pub creator_name : String,

    #[max_len(200)]
    pub proof_url: String,

    pub bump : u8
}
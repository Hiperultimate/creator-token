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

// Slope TBD
#[account]
#[derive(InitSpace)]
pub struct CreatorToken {
    pub creator_wallet: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub base_price: u64,
    pub slope: u64,
    pub total_supply: u64,
    pub created_at: i64,
    pub bump: u8,
    pub mint_authority_bump: u8
}
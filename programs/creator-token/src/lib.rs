pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("EEiGYjpth5GS6fNvX2a2ZbQV7gCNAZjMRE3XMtBrFbfq");

#[program]
pub mod creator_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_creator_identity(ctx: Context<CreatorIdentity>, user_name : String, proof_url: String) -> Result<()> {
        creator_identity::handler(ctx,user_name,proof_url)
    }
}

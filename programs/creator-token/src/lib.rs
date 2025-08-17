pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod helpers;

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

    // NOTE : We may have to remove initial supply to keep the token vault and token supply healthy
    pub fn create_creator_token(ctx: Context<CreateCreatorToken>, decimals: u8, initial_supply: u64, base_price: u64, slope: u64) -> Result<()> {
        create_creator_token::handler(ctx,decimals, initial_supply, base_price, slope)
    }

    pub fn buy_creator_token(ctx: Context<BuyToken>, tokens_to_buy: u64 ) -> Result<()> {
        buy_token::handler(ctx, tokens_to_buy)
    }

    pub fn get_buying_token_price(ctx: Context<TokenPrice>, tokens_to_buy: u64) -> Result<u64> {
        token_price::buying_cost(ctx, tokens_to_buy)
    }

    pub fn get_selling_return_price(ctx: Context<TokenPrice>, tokens_to_buy: u64) -> Result<u64> {
        token_price::selling_return(ctx, tokens_to_buy)
    }

    pub fn sell_creator_token(ctx: Context<SellToken>, token_to_sell: u64 ) -> Result<()> {
        sell_token::handler(ctx, token_to_sell)
    }
}

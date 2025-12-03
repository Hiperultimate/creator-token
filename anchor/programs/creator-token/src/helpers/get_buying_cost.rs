use anchor_lang::prelude::*;

use crate::error::CustomError;

pub fn get_buying_cost(
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

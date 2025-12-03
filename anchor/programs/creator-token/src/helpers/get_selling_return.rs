use anchor_lang::prelude::*;

use crate::error::CustomError;

pub fn get_selling_return(
    tokens_to_sell_base: u64,   // base units being sold
    current_supply_base: u64,   // base units
    base_price_per_token: u64,  // lamports per whole token
    slope_per_token: u64,       // lamports per whole token supply
    decimals: u8,               // mint.decimals
) -> Result<u64> {
    let d: u128 = 10u128.checked_pow(decimals as u32).ok_or(error!(CustomError::MathOverflow))?;
    let d2 = d.checked_mul(d).ok_or(error!(CustomError::MathOverflow))?;

    let t = tokens_to_sell_base as u128;
    let s0 = current_supply_base as u128;
    let b = base_price_per_token as u128;
    let m = slope_per_token as u128;

    // Numerator:
    // term1 = b * t * D
    // term2 = m * (s0 * t)
    // term3 = - m * (t^2 / 2)
    let term1 = b.checked_mul(t).and_then(|x| x.checked_mul(d)).ok_or(error!(CustomError::MathOverflow))?;
    let term2 = m.checked_mul(s0).and_then(|x| x.checked_mul(t)).ok_or(error!(CustomError::MathOverflow))?;
    let t2_half = t.checked_mul(t).and_then(|x| x.checked_div(2)).ok_or(error!(CustomError::MathOverflow))?;
    let term3 = m.checked_mul(t2_half).ok_or(error!(CustomError::MathOverflow))?;

    let numer = term1
        .checked_add(term2).and_then(|x| x.checked_sub(term3))
        .ok_or(error!(CustomError::MathOverflow))?;

    let amount = numer.checked_div(d2).ok_or(error!(CustomError::MathOverflow))?;
    let amount_u64: u64 = amount.try_into().map_err(|_| error!(CustomError::MathOverflow))?;
    Ok(amount_u64)
}

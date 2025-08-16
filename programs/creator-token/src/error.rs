use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
}


#[error_code]
pub enum IdentityError {
    #[msg("The length of the name entered exeeds 50 characters")]
    NameTooLong,

    #[msg("The length of the url entered exeeds 200 characters")]
    UrlTooLong,
}

#[error_code]
pub enum CustomError {
    #[msg("Overflow occured while calculating")]
    MathOverflow,
}
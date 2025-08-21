import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreatorToken } from "../target/types/creator_token";
import { assert, expect } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getMint,
  Mint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { airDropSOLAmount, buyCreatorToken, checkConfirmTransaction, getBuyingPriceForToken, getSellingPriceForToken } from "./helper-fns";

describe("creator-token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.creatorToken as Program<CreatorToken>;
  const creator = anchor.web3.Keypair.generate();
  const fan = anchor.web3.Keypair.generate();

  // Token details
  let creatorToken: Mint;
  let identityAddress: anchor.web3.PublicKey;
  let vaultAddress: anchor.web3.PublicKey;

  // Write a before statement where you mint some tokens to creator
  before(async () => {
    // mint SOL to creator
    const airdropTx = await airDropSOLAmount(provider, creator.publicKey, 5);
    console.log("Airdropped SOL successfully :", airdropTx);
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Fails in creating creator identity with incorrect length user_name and proof_url", async () => {
    const valid_username = "Jonathan Joestar";
    const valid_url = "https://proof_url.com/";
    const invalid_username = valid_username.repeat(10);
    const invalid_url = valid_url.repeat(20);

    // Invalid username , valid URL
    try {
      const tx = await program.methods
        .createCreatorIdentity(invalid_username, valid_url)
        .accounts({ creator: creator.publicKey })
        .signers([creator])
        .rpc();

      assert.fail(
        `Expected transaction to fail but it succeeded instead :${tx}`
      );
    } catch (err) {
      if (err.name === "AssertionError") {
        throw err;
      }
      const anchorErrCode = err.error.errorCode.code;
      expect(anchorErrCode).eq("NameTooLong");
    }

    // Valid username, invalid URL
    try {
      const tx = await program.methods
        .createCreatorIdentity(valid_username, invalid_url)
        .accounts({ creator: creator.publicKey })
        .signers([creator])
        .rpc();

      assert.fail(
        `Expected transaction to fail but it succeeded instead :${tx}`
      );
    } catch (err) {
      if (err.name === "AssertionError") {
        throw err;
      }
      const anchorErrCode = err.error.errorCode.code;
      expect(anchorErrCode).eq("UrlTooLong");
    }
  });

  // Write success test for creator identity
  it("Success creating creator identity profile", async () => {
    const valid_username = "Jonathan Joestar";
    const valid_url = "https://proof_url.com/";
    const tx = await program.methods
      .createCreatorIdentity(valid_username, valid_url)
      .accounts({ creator: creator.publicKey })
      .signers([creator])
      .rpc();
    console.log("Successfully created creator identity profile :", tx);

    await checkConfirmTransaction(provider, tx);

    const identitySeed = [
      Buffer.from("identity"),
      creator.publicKey.toBuffer(),
    ];
    const [getIdentityAddress, _] =
      anchor.web3.PublicKey.findProgramAddressSync(
        identitySeed,
        program.programId
      );

    identityAddress = getIdentityAddress;

    const vaultSeeds = [Buffer.from("vault"), identityAddress.toBuffer()];
    const [getVaultAddress, _vaultBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        vaultSeeds,
        program.programId
      );

    vaultAddress = getVaultAddress;

    const identityStoredData = await program.account.identity.fetch(
      identityAddress,
      "confirmed"
    );
    expect(identityStoredData.creator.toBase58).eq(creator.publicKey.toBase58);
    expect(identityStoredData.creatorName).eq(valid_username);
    expect(identityStoredData.proofUrl).eq(valid_url);
  });

  it("Success creating a creators token and then creator buys their own token", async () => {
    // const creatorSupplyTokenAmount = 100;
    const tokenDecimals = 6;
    // const initialSupply = new anchor.BN(
    //   Math.pow(10, tokenDecimals) * creatorSupplyTokenAmount
    // );
    const basePrice = new anchor.BN(5_000_000);
    const slope = new anchor.BN(700_000);
    // Call creator token
    const tx = await program.methods
      // .createCreatorToken(tokenDecimals, initialSupply, basePrice, slope)
      .createCreatorToken(tokenDecimals, basePrice, slope)
      .accounts({
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Checking success token creators :", tx);

    // New SPL Token checks
    const tokenSeed = [Buffer.from("owner"), identityAddress.toBuffer()];
    const [tokenMintAddress, _tokenSeedBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        tokenSeed,
        program.programId
      );

    await checkConfirmTransaction(provider, tx);

    creatorToken = await getMint(
      provider.connection,
      tokenMintAddress,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const mintAuthoritySeed = [Buffer.from("mint_authority")];
    const [mintAuthority, _mintAuthBump] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        mintAuthoritySeed,
        program.programId
      );

    expect(creatorToken.freezeAuthority.toBase58()).eq(
      mintAuthority.toBase58()
    );
    expect(creatorToken.mintAuthority.toBase58()).eq(mintAuthority.toBase58());
    expect(creatorToken.decimals).eq(tokenDecimals);
    expect(creatorToken.isInitialized).eq(true);

    // Check if initialSupply was supplied to creator's ATA
    // const creatorsATA = getAssociatedTokenAddressSync(
    //   creatorToken.address,
    //   creator.publicKey,
    //   undefined,
    //   TOKEN_2022_PROGRAM_ID,
    //   ASSOCIATED_TOKEN_PROGRAM_ID
    // );

    // const creatorsATAData = await provider.connection.getTokenAccountBalance(
    //   creatorsATA,
    //   "confirmed"
    // );

    // expect(creatorsATAData.value.uiAmount).eq(creatorSupplyTokenAmount);

    // Make creator buy some of their newly made token in exchange for some SOL

    const amtOfTokens = 50;
    const { buyCreatorTokenTx, tokenBought } = await buyCreatorToken({
      provider: provider,
      program: program,
      decimals: creatorToken.decimals,
      signer: creator,
      tokenCreator: creator.publicKey,
      tokenToMintWholeNumber: amtOfTokens,
    });

    console.log("Fan successfully bought creator tokens : ", buyCreatorTokenTx);

    const creatorATA = await getAssociatedTokenAddress(
      creatorToken.address,
      creator.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createrATABalance = await provider.connection.getTokenAccountBalance(
      creatorATA,
      "confirmed"
    );

    expect(createrATABalance.value.uiAmount).eq(amtOfTokens);
    expect(createrATABalance.value.decimals).eq(creatorToken.decimals);
    expect(createrATABalance.value.amount).eq(tokenBought.toString());
  });

  it("Success fan buys some creator tokens", async () => {
    // airdrop fan, then confirm transaction
    await airDropSOLAmount(provider, fan.publicKey, 10);

    const initialVaultBalance = await provider.connection.getBalance(
      vaultAddress,
      "confirmed"
    );

    const amtOfTokens = 25;
    const { buyCreatorTokenTx, tokenBought: tokenToBuy } =
      await buyCreatorToken({
        provider: provider,
        program: program,
        decimals: creatorToken.decimals,
        signer: fan,
        tokenCreator: creator.publicKey,
        tokenToMintWholeNumber: amtOfTokens,
      });

    console.log("Fan successfully bought creator tokens : ", buyCreatorTokenTx);

    // Check how many tokens does the fan has
    // Derive fan ATA for token
    const fanATA = await getAssociatedTokenAddress(
      creatorToken.address,
      fan.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const fanATABalance = await provider.connection.getTokenAccountBalance(
      fanATA,
      "confirmed"
    );

    expect(fanATABalance.value.uiAmount).eq(amtOfTokens);
    expect(fanATABalance.value.decimals).eq(creatorToken.decimals);
    expect(fanATABalance.value.amount).eq(tokenToBuy.toString());

    const lamportsNeeded = await program.methods
      .getSellingReturnPrice(tokenToBuy)
      .accounts({
        creator: creator.publicKey,
      })
      .view();
    // console.log("CHECKING lamports needed ", new anchor.BN(lamportsNeeded).toString());
    const lamportsNeededBN = new anchor.BN(lamportsNeeded);

    const laterVaultBalance = await provider.connection.getBalance(
      vaultAddress,
      "confirmed"
    );

    // console.log("CHECKING VAULT BALANCE :", laterVaultBalance);

    expect(laterVaultBalance - initialVaultBalance).eq(
      lamportsNeededBN.toNumber()
    );
  });

  it("Fan sells their creator tokens", async () => {
    const amtOftokenToSell = new anchor.BN(25);
    const tokenToSell = new anchor.BN(amtOftokenToSell).mul(
      new anchor.BN(10).pow(new anchor.BN(creatorToken.decimals))
    ); // amtOfTokens * (10 ** tokenDecimals) = 25 * 10^6

    const fanBalanceBefore = await provider.connection.getBalance(
      fan.publicKey,
      "confirmed"
    );

    // Check vault lamports should be > 0
    const vaultBalanceBefore = await provider.connection.getBalance(
      vaultAddress,
      "confirmed"
    );
    // console.log("Checking vault balance before : ", vaultBalanceBefore);
    expect(vaultBalanceBefore).greaterThan(0);

    const sellTx = await program.methods
      .sellCreatorToken(tokenToSell)
      .accounts({
        seller: fan.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([fan])
      .rpc();

    console.log("Fan successfully sold tokens : ", sellTx);

    await checkConfirmTransaction(provider, sellTx);

    const vaultBalanceAfter = await provider.connection.getBalance(
      vaultAddress,
      "confirmed"
    );

    // Check user lamports should be +
    const fanBalanceAfter = await provider.connection.getBalance(
      fan.publicKey,
      "confirmed"
    );
    // console.log("Checking fan balance :", fanBalanceBefore, fanBalanceAfter);
    expect(fanBalanceAfter - fanBalanceBefore).eq(
      vaultBalanceBefore - vaultBalanceAfter
    );
  });

  it("Fan makes a profit by buying early and selling later", async () => {
    // Create fan 1
    // Create fan 2
    const fan1 = anchor.web3.Keypair.generate();
    const fan2 = anchor.web3.Keypair.generate();

    // Airdrop SOL to fan1
    // Airdrop SOL to fan2
    const SOL_TO_AIRDROP = 20;
    await airDropSOLAmount(provider, fan1.publicKey, SOL_TO_AIRDROP);
    await airDropSOLAmount(provider, fan2.publicKey, SOL_TO_AIRDROP);

    // fan1 buys 10 creator token
    // fan2 buys 10 creator token next
    const amtOfTokens = 10;

    // Check buy price of fan1 to buy tokens
    const fan1QuotedBuyingPrice = await getBuyingPriceForToken(program, amtOfTokens, creatorToken.decimals, creator.publicKey);
    const { buyCreatorTokenTx: fan1BuyTokenTx, tokenBought: tokenBoughtFan1 } =
      await buyCreatorToken({
        provider,
        program,
        decimals: creatorToken.decimals,
        signer: fan1,
        tokenCreator: creator.publicKey,
        tokenToMintWholeNumber: amtOfTokens,
      });

    // Check buy price of fan2 to buy tokens
    const fan2QuotedBuyingPrice = await getBuyingPriceForToken(program, amtOfTokens, creatorToken.decimals, creator.publicKey);
    const { buyCreatorTokenTx: fan2BuyTokenTx, tokenBought: tokenBoughtFan2 } =
      await buyCreatorToken({
        provider,
        program,
        decimals: creatorToken.decimals,
        signer: fan2,
        tokenCreator: creator.publicKey,
        tokenToMintWholeNumber: amtOfTokens,
      });

    expect(tokenBoughtFan1.toString()).eq(tokenBoughtFan2.toString());
    expect(new anchor.BN(fan1QuotedBuyingPrice).sub(new anchor.BN(fan2QuotedBuyingPrice)).toNumber()).lessThan(0); // fan2 quoted price should be greater

    let tokenAmtToSell = tokenBoughtFan1; // both fans should have same amount of tokens

    console.log("Fan 1 bought creator token succesfully : ", fan1BuyTokenTx);
    console.log("Fan 2 bought creator token succesfully : ", fan2BuyTokenTx);
    // console.log("Checking the price of fan1 and fan2 buying : ", fan1QuotedBuyingPrice.toString(), fan2QuotedBuyingPrice.toString());
    
    // check how much SOL would fan1 get for selling his current token
    const fan1QuotedSellPrice = await getSellingPriceForToken(program, amtOfTokens, creatorToken.decimals, creator.publicKey);

    // fan1 sells creator token first to get a profit
    // fan2 sells creator token second at a loss
    const fan1SellTx = await program.methods
      .sellCreatorToken(tokenAmtToSell)
      .accounts({
        seller: fan1.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([fan1])
      .rpc();
    await checkConfirmTransaction(provider, fan1SellTx);

    console.log("Fan1 successfully sold tokens : ", fan1SellTx);

    // check how much SOL would fan2 get for selling his current token
    const fan2QuotedSellPrice = await getSellingPriceForToken(program, amtOfTokens, creatorToken.decimals, creator.publicKey);

    const fan2SellTx = await program.methods
      .sellCreatorToken(tokenAmtToSell)
      .accounts({
        seller: fan2.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([fan2])
      .rpc();
    await checkConfirmTransaction(provider, fan2SellTx);

    console.log("Fan2 successfully sold tokens : ", fan2SellTx);

    // compare fan1 initial SOL count with after selling creator token, pass if higher than before
    // console.log("Checking the price of fan1 and fan2 sell : ", fan1QuotedSellPrice.toString(), fan2QuotedSellPrice.toString());
    expect(new anchor.BN(fan1QuotedSellPrice).sub(new anchor.BN(fan2QuotedSellPrice)).toNumber()).greaterThan(0); // fan1 quoted price should be greater

    const fan1BalanceAfterSell = await provider.connection.getBalance(fan1.publicKey);
    const fan2BalanceAfterSell = await provider.connection.getBalance(fan2.publicKey);

    expect(fan1BalanceAfterSell).greaterThan(fan2BalanceAfterSell);
    expect(fan2QuotedBuyingPrice.toString()).eq(fan1QuotedSellPrice.toString());
    expect(fan1QuotedBuyingPrice.toString()).eq(fan2QuotedSellPrice.toString());
  });
});
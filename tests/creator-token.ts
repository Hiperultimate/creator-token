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

describe("creator-token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.creatorToken as Program<CreatorToken>;
  const creator = anchor.web3.Keypair.generate();
  const fan = anchor.web3.Keypair.generate();

  let creatorToken: Mint;

  // Write a before statement where you mint some tokens to creator
  before(async () => {
    // mint SOL to creator
    const airdropTx = await provider.connection.requestAirdrop(
      creator.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
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

    const latestBlock = await provider.connection.getLatestBlockhash();
    await program.provider.connection.confirmTransaction(
      {
        blockhash: latestBlock.blockhash,
        lastValidBlockHeight: latestBlock.lastValidBlockHeight,
        signature: tx,
      },
      "confirmed"
    );

    const identitySeed = [
      Buffer.from("identity"),
      creator.publicKey.toBuffer(),
    ];
    const [identityAddress, _] = anchor.web3.PublicKey.findProgramAddressSync(
      identitySeed,
      program.programId
    );

    const identityStoredData = await program.account.identity.fetch(
      identityAddress,
      "confirmed"
    );
    expect(identityStoredData.creator.toBase58).eq(creator.publicKey.toBase58);
    expect(identityStoredData.creatorName).eq(valid_username);
    expect(identityStoredData.proofUrl).eq(valid_url);
  });

  it("Success creating a creators token and then creator buys some token", async () => {
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
    const identityProofSeed = [
      Buffer.from("identity"),
      creator.publicKey.toBuffer(),
    ];
    const [identityProofAddress, _identityProofBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        identityProofSeed,
        program.programId
      );
    // const identityProof = await program.account.identity.fetch(identityProofAddress, "confirmed");
    const tokenSeed = [Buffer.from("owner"), identityProofAddress.toBuffer()];
    const [tokenMintAddress, _tokenSeedBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        tokenSeed,
        program.programId
      );

    let blockHash = await provider.connection.getLatestBlockhash();
    await program.provider.connection.confirmTransaction(
      {
        blockhash: blockHash.blockhash,
        lastValidBlockHeight: blockHash.lastValidBlockHeight,
        signature: tx,
      },
      "confirmed"
    );
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
    const tokenToBuy = new anchor.BN(amtOfTokens).mul(
      new anchor.BN(10).pow(new anchor.BN(creatorToken.decimals))
    );

    const buyCreatorTokenTx = await program.methods
      .buyCreatorToken(tokenToBuy)
      .accounts({
        buyer: creator.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Fan successfully bought creator tokens : ", buyCreatorTokenTx);

    blockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: blockHash.blockhash,
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
      signature: buyCreatorTokenTx,
    });

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
    expect(createrATABalance.value.amount).eq(tokenToBuy.toString());
  });

  it("Success fan buys some creator tokens", async () => {
    const amtOfTokens = 25;
    const tokenToBuy = new anchor.BN(amtOfTokens).mul(
      new anchor.BN(10).pow(new anchor.BN(creatorToken.decimals))
    ); // amtOfTokens * (10 ** tokenDecimals) = 25 * 10^6

    // airdrop fan, then confirm transaction
    const airdropTx = await provider.connection.requestAirdrop(
      fan.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    let blockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: blockHash.blockhash,
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
      signature: airdropTx,
    });

    const identityProofSeed = [
      Buffer.from("identity"),
      creator.publicKey.toBuffer(),
    ];
    const [identityProofAddress, _identityProofBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        identityProofSeed,
        program.programId
      );

    const vaultSeeds = [Buffer.from("vault"), identityProofAddress.toBuffer()];
    const [vaultAddress, _vaultBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        vaultSeeds,
        program.programId
      );

    const initialVaultBalance = await provider.connection.getBalance(
      vaultAddress,
      "confirmed"
    );

    const buyCreatorTokenTx = await program.methods
      .buyCreatorToken(tokenToBuy)
      .accounts({
        buyer: fan.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([fan])
      .rpc();

    console.log("Fan successfully bought creator tokens : ", buyCreatorTokenTx);

    blockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: blockHash.blockhash,
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
      signature: buyCreatorTokenTx,
    });

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

    expect(laterVaultBalance-initialVaultBalance).eq(lamportsNeededBN.toNumber());
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
    const identityProofSeed = [
      Buffer.from("identity"),
      creator.publicKey.toBuffer(),
    ];
    const [identityProofAddress, _identityProofBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        identityProofSeed,
        program.programId
      );
    const vaultSeeds = [Buffer.from("vault"), identityProofAddress.toBuffer()];
    const [vaultAddress, _vaultBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        vaultSeeds,
        program.programId
      );
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
    
    const latestBlock = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlock.blockhash,
      lastValidBlockHeight: latestBlock.lastValidBlockHeight,
      signature: sellTx,
    });

    const vaultBalanceAfter = await provider.connection.getBalance(vaultAddress, "confirmed");

    // Check user lamports should be +
    const fanBalanceAfter = await provider.connection.getBalance(fan.publicKey, "confirmed");
    // console.log("Checking fan balance :", fanBalanceBefore, fanBalanceAfter);
    expect(fanBalanceAfter - fanBalanceBefore).eq(vaultBalanceBefore- vaultBalanceAfter);

  });

  it("Fan makes a profit by buying early and selling later", async () => {
    // Create fan 1 
    // Create fan 2

    // Mint SOL to fan1 
    // Mint SOL to fan2

    // fan1 buys 50 creator token
    // fan2 buys 50 creator token next

    // fan1 sells creator token
    // fan2 sells creator token

    // compare fan1 initial SOL count with after selling creator token, pass if higher than before

    // check if vault has 0 SOL
  } )
});

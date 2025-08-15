import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreatorToken } from "../target/types/creator_token";
import { assert, expect } from "chai";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("creator-token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.creatorToken as Program<CreatorToken>;
  const creator = anchor.web3.Keypair.generate();

  // Write a before statement where you mint some tokens to creator
  before(async () => { 
    // mint SOL to creator
    const airdropTx = await provider.connection.requestAirdrop(creator.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
    console.log("Airdropped SOL successfully :", airdropTx);
  })

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
        .accounts({creator : creator.publicKey})
        .signers([creator])
        .rpc();
      
      assert.fail(`Expected transaction to fail but it succeeded instead :${tx}`);
    } catch (err) {
      if(err.name === "AssertionError"){
        throw err
      }
      const anchorErrCode = err.error.errorCode.code;
      expect(anchorErrCode).eq('NameTooLong');
    }

    // Valid username, invalid URL
    try {
      const tx = await program.methods
        .createCreatorIdentity(valid_username, invalid_url)
        .accounts({ creator: creator.publicKey })
        .signers([creator])
        .rpc();

      assert.fail(`Expected transaction to fail but it succeeded instead :${tx}`);
    } catch (err) {
      if(err.name === "AssertionError"){
        throw err
      }
      const anchorErrCode = err.error.errorCode.code;
      expect(anchorErrCode).eq("UrlTooLong");
    }
  })

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

    const identitySeed = [Buffer.from("identity"), creator.publicKey.toBuffer()];
    const [identityAddress, _] = anchor.web3.PublicKey.findProgramAddressSync(identitySeed,program.programId);

    const identityStoredData = await program.account.identity.fetch(identityAddress, "confirmed");
    expect(identityStoredData.creatorWallet.toBase58).eq(creator.publicKey.toBase58);
    expect(identityStoredData.creatorName).eq(valid_username);
    expect(identityStoredData.proofUrl).eq(valid_url);
  })
  
  it("Success creating a creators token", async () => {
    const tokenDecimals = 6;
    const initialSupply = new anchor.BN(1000000);
    // Call creator token
    const tx = await program.methods
      .createCreatorToken(tokenDecimals, initialSupply)
      .accounts({
        creator: creator.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Checking success token creators :", tx);

    // check if made token is live
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

    const blockHash = await provider.connection.getLatestBlockhash();
    await program.provider.connection.confirmTransaction(
      {
        blockhash: blockHash.blockhash,
        lastValidBlockHeight: blockHash.lastValidBlockHeight,
        signature: tx,
      },
      "confirmed"
    );
    const creatorToken = await getMint(provider.connection, tokenMintAddress, "confirmed", TOKEN_2022_PROGRAM_ID);
    console.log("Checking TOKEN DETAILS : ", creatorToken);

    const mintAuthoritySeed = [Buffer.from("mint_authority")];
    const [mintAuthority, _mintAuthBump] = await anchor.web3.PublicKey.findProgramAddressSync(mintAuthoritySeed, program.programId);
    
    expect(creatorToken.freezeAuthority.toBase58()).eq(mintAuthority.toBase58());
    expect(creatorToken.mintAuthority.toBase58()).eq(mintAuthority.toBase58());
    expect(creatorToken.decimals).eq(tokenDecimals);
    expect(creatorToken.isInitialized).eq(true);
  })
});

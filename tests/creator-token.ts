import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreatorToken } from "../target/types/creator_token";
import { assert, expect } from "chai";

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

    const identitySeed = [Buffer.from("identity"), creator.publicKey.toBuffer()];
    const [identityAddress, _] = anchor.web3.PublicKey.findProgramAddressSync(identitySeed,program.programId);

    const identityStoredData = await program.account.identity.fetch(identityAddress, "confirmed");
    expect(identityStoredData.creatorWallet.toBase58).eq(creator.publicKey.toBase58);
    expect(identityStoredData.creatorName).eq(valid_username);
    expect(identityStoredData.proofUrl).eq(valid_url);
  })
});

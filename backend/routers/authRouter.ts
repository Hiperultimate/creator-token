import { Router } from "express";
import { prisma } from "../src/lib/prisma";
import { checkWalletKey, signInSchema } from "../validations/schema";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { verifySignature } from "../utils/verifySignature";

const authRouter = Router();

const userNonceStorage: Record<string, string> = {};

authRouter.get("/nonce/:walletPublicKey", (req, res) => { 
  const { walletPublicKey: walletPublicKeyRaw } = req.params;
  const validInputCheck = checkWalletKey.safeParse({
    walletPublicKey: walletPublicKeyRaw,
  });
  if (!validInputCheck.success)
    return res.status(400).send("Wallet key not found");

  const nonce = randomBytes(16).toString("hex");
  userNonceStorage[validInputCheck.data.walletPublicKey] = nonce;
  return res.status(200).send(nonce);
})

authRouter.post("/signin", async (req, res) => {
  // User enters their wallet

  // Get input as sent in AuthContext.ts
  const {
    walletPublicKey: walletPublicKeyRaw,
    nonce : nonceRaw,
    signedMessage: signedMessageRaw,
  } = req.body;

  const validInputCheck = signInSchema.safeParse({
    walletPublicKey: walletPublicKeyRaw,
    nonce : nonceRaw,
    signedMessage : signedMessageRaw,
  });

  if (!validInputCheck.success)
    return res.status(400).send("Invalid payload provided.");

  const { walletPublicKey, nonce, signedMessage } = validInputCheck.data;

  const signingMessage = `Sign this message to authenticate : nonce ${userNonceStorage[walletPublicKey]}`
  // Then perform validation like its done in authContext with publicKey
  const isSigVerified = verifySignature({ message: signingMessage, signature: signedMessage, walletAddress: walletPublicKey });

  if (!isSigVerified) return res.status(400).send("Invalid signature found, there is something wrong with your wallet signature");
  // if true, send auth key else fail
  delete userNonceStorage[walletPublicKey];

  // We check if user's wallet exists in the DB
  let user = await prisma.user.findUnique({
    where: { walletAddress: walletPublicKeyRaw },
    select: { id: true, walletAddress: true },
  });

  // If not, add them in the db
  if (!user)
    user = await prisma.user.create({
      data: { walletAddress: walletPublicKey },
      select: { id: true, walletAddress: true },
    });

  const expireTime = 60 * 60 * 24;
  const auth_token = jwt.sign(user, process.env.JWT_KEY || "", {
    expiresIn: expireTime,
  });

  // return cookies
  res.cookie("auth_token", auth_token, {
    httpOnly: false,
    maxAge: expireTime * 1000,
  });

   return res.status(200).send(true);
 });

authRouter.get("/user/:walletPublicKey", async (req, res) => {
  const { walletPublicKey: walletPublicKeyRaw } = req.params;
  const validInputCheck = checkWalletKey.safeParse({
    walletPublicKey: walletPublicKeyRaw,
  });
  if (!validInputCheck.success)
    return res.status(400).send("Wallet key not found");

  const walletPublicKey = validInputCheck.data.walletPublicKey;

  // Validate cookie
  const authToken = req.cookies.auth_token;
  if (!authToken) return res.status(401).send("Unauthorized");

  let decoded;
  try {
    decoded = jwt.verify(authToken, process.env.JWT_KEY || "") as { walletAddress: string };
  } catch (error) {
    return res.status(401).send("Invalid token");
  }

  if (decoded.walletAddress !== walletPublicKey) {
    return res.status(403).send("Forbidden");
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: walletPublicKey },
    select: {
      id: true,
      walletAddress: true,
      creator: {
        select: { creatorAddress: true },
      },
    },
  });

  if (!user) return res.status(404).send("User not found");

  const userData = {
    walletAddress: user.walletAddress,
    isCreator: !!user.creator,
  };

  return res.status(200).json(userData);
});

export default authRouter;

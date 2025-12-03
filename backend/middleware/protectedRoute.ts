import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: { walletAddress: string };
}

export const protectedRoute = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authToken = req.cookies.auth_token;
  if (!authToken) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_KEY || "") as { walletAddress: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
};
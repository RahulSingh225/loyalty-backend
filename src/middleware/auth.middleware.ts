import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import User from "../types/user";

// declare module 'express' {
//   interface Request {
//     user: any
//   }
// }

export class AuthMiddleware {
  verifyJWT(req, res: Response, next: NextFunction) {
    try {
      console.log(req.headers);
      const token = req.header("Authorization")?.replace("Bearer ", "");
      console.log(token);
      if (!token) {
        throw new Error("Unauthorized request");
      }
      const user = jwt.verify(
        token,
        process.env.ACCESSS_TOKEN_SECRET as string
      ) as User;
      if (!user || user.userId === null) {
        throw new Error("User data is incomplete or missing");
      }
      req.user = user as User;
      next();
    } catch (error: any) {
      return res.status(401).json(error.message || "Invalid access token");
    }
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();

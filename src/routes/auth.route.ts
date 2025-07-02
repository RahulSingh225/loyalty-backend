


import { Router } from "express";
import { authController } from "../controllers";
import { auth } from "firebase-admin";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", authMiddleware.verifyFirebaseToken, authController.createUser.bind(authController));
authRouter.post("/login", authMiddleware.verifyFirebaseToken, authController.loginUser.bind(authController));




export default authRouter;
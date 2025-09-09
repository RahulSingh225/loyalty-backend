


import { Router } from "express";
import { authController } from "../controllers";
import { auth } from "firebase-admin";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", authMiddleware.mobileToken, authController.createUser.bind(authController));
authRouter.post("/login", authController.loginUser.bind(authController));
authRouter.post("/send-otp", authController.sendOtp.bind(authController));
authRouter.post("/verify-otp", authController.verifyOtp.bind(authController));



export default authRouter;
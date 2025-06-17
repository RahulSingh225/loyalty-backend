


import { Router } from "express";
import { authController } from "../controllers";
import { auth } from "firebase-admin";

const authRouter = Router();

authRouter.post("/register", authController.createUser.bind(authController));
authRouter.post("/login", authController.loginUser.bind(authController));




export default authRouter;
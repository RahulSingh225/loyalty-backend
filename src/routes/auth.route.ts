/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 *
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               mobile_number:
 *                 type: string
 *               secondary_mobile_number:
 *                 type: string
 *               hashedPassword:
 *                 type: string
 *               distributor_name:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip_code:
 *                 type: string
 *               fcm_token:
 *                 type: string
 *               device_details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Distributor onboarded successfully
 *         content:
*           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 distributor_name:
   *                   type: string
   *
 *       400:
 *         description: Invalid input
 *
 * /login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */

/**
 * Defines authentication-related routes for user registration and login.
 *
 * @module auth.route
 * @remarks
 * This router handles endpoints for user registration and login by delegating
 * requests to the corresponding methods in the `authController`.
 *
 * @example
 * // Register a new user
 * POST /register
 *
 * // Login an existing user
 * POST /login
 */
import { Router } from "express";
import { authController } from "../controllers";
import { auth } from "firebase-admin";

const authRouter = Router();

authRouter.post("/register", authController.createUser.bind(authController));
authRouter.post("/login", authController.loginUser.bind(authController));




export default authRouter;
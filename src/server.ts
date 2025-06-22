import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./services/logger.service";
import { routers } from "./routes";
//import FirebaseService from './services/firebase.service';
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Load environment variables
dotenv.config();

// Interfaces
interface EnvConfig {
  POSTGRES_USER: string;
  POSTGRES_HOST: string;
  POSTGRES_DB: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_PORT: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  PORT: string;
}

// Initialize services
// const firebaseService = new FirebaseService({
//   projectId: env.FIREBASE_PROJECT_ID,
//   privateKey: env.FIREBASE_PRIVATE_KEY,
//   clientEmail: env.FIREBASE_CLIENT_EMAIL,
//   storageBucket: `${env.FIREBASE_PROJECT_ID}.appspot.com`
// });

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

routers.forEach((router) => {
  app.use(router.path, router.router);
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  //logger.info(`Request: ${req.method} ${req.url}`, { body: req.body });
  next();
});

// Start server
const port = parseInt(env.PORT) || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

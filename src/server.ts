import express, { Request, Response, NextFunction } from "express";
import { DatabaseError, Pool } from "pg";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./services/logger.service";
import { routers } from "./routes";
import App from "./app";
import { drizzle } from "drizzle-orm/node-postgres";

//import FirebaseService from './services/firebase.service';


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
 process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Closing database connection...');
      //await DBService.getInstance().close();
      process.exit(0);
    });

    const app = new App();

app.listen(3000);


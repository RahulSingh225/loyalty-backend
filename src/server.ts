import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './services/logger.service';
import { routers } from './routes';
//import FirebaseService from './services/firebase.service';
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

interface RetailerOnboardRequest {
  username: string;
  mobile_number: string;
  secondary_mobile_number?: string;
  password: string;
  shop_name: string;
  shop_address: string;
  pin_code: string;
  city: string;
  state: string;
  fcm_token?: string;
  device_details?: Record<string, string>;
}

interface DistributorOnboardRequest {
  username: string;
  mobile_number: string;
  secondary_mobile_number?: string;
  password: string;
  distributor_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  fcm_token?: string;
  device_details?: Record<string, string>;
}

interface OTPSendRequest {
  mobile_number: string;
}

interface OTPVerifyRequest {
  mobile_number: string;
  id_token: string;
  fcm_token?: string;
  device_details?: Record<string, string>;
}

interface PasswordLoginRequest {
  mobile_number: string;
  password: string;
  fcm_token?: string;
  device_details?: Record<string, string>;
}

interface PointsUpdateRequest {
  user_id: number;
  points: number;
  operation: 'allocate' | 'consume';
}

interface FunctionResponse {
  success: boolean;
  error?: string;
  user_id?: number;
  retailer_id?: number;
  distributor_id?: number;
  transaction_id?: number;
  points?: number;
  operation?: string;
  user_type?: string;
  total_points?: number;
  balance_points?: number;
  consumed_points?: number;
  data?: Record<string, any>;
}

// Validate environment variables
const env: EnvConfig = process.env as unknown as EnvConfig;
if (!env.POSTGRES_USER || !env.FIREBASE_PROJECT_ID || !env.PORT) {
  throw new Error('Missing required environment variables');
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



const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Node.js API Documentation',
      version: '1.0.0',
      description: 'API documentation with cURL examples for Node.js backend',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Scan all .js files in the routes folder
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Serve Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});


// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  //logger.info(`Request: ${req.method} ${req.url}`, { body: req.body });
  next();
});

// Hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}




// Start server
const port = parseInt(env.PORT) || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
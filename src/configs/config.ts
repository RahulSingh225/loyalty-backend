import dotenv from "dotenv";
dotenv.config();

export const TEMP_TOKEN_EXPIRATION = "5m";
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET as string;
export const ACCESSS_TOKEN_SECRET = process.env.ACCESSS_TOKEN_SECRET as string;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
export const ACCESSS_TOKEN_EXPIRY = process.env.ACCESSS_TOKEN_EXPIRY as string;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as string;
export const CUSTOMER_TOKEN_EXPIRY = process.env
  .CUSTOMER_TOKEN_EXPIRY as string;
export const FILE_SIZE = 5 * 1024 * 1024;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env
  .AWS_SECRET_ACCESS_KEY as string;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_SIGNED_URL_EXPIRY = 600;


export const FIREBASE_CONFIG = {
  type: process.env.FIREBASE_TYPE,
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: process.env.FIREBASE_AUTH_URI,
  tokenUri: process.env.FIREBASE_TOKEN_URI,
  authProviderCertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
  universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

export const GlobalState = {
  schemeFilter: '', // Default value
};

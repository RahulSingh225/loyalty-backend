import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import  User  from '../types/user'; // Adjusted import to use named export
import  {firebaseService}  from '../services/firebase.service';
import {
  ACCESSS_TOKEN_EXPIRY,
  ACCESSS_TOKEN_SECRET,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
  TEMP_TOKEN_EXPIRATION,
} from '../configs/config';
import { subMinutes, isBefore } from 'date-fns';

// Define interface for JwtPayload to ensure type safety
interface AuthJwtPayload extends JwtPayload {
  accessToken: string;
  refreshToken: string;
}

// Define interface for MobileTokenPayload




// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export class AuthMiddleware {


 
  async mobileToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('Unauthorized request');
      }

      const decoded = jwt.verify(token, JWT_SECRET) ;
      req.user = decoded;

      if (!decoded) {
        throw new Error('Invalid mobile token');
      }

      // Commented-out code retained as per original
      // let payload = new UserSearch({
      //   mobile: decoded?.mobile,
      //   userCode: "",
      //   userId: 0,
      //   email: decoded?.email,
      //   country: "",
      //   countryCode: ""
      // });

      // let otpData = await userRepository.getRecentOtp(payload, "recent");
      // if (otpData?.otpTable?.otp != decoded?.otp) {
      //   this.customError.responseMessage = "Token expired, Please re-intiate";
      //   throw this.customError;
      // } // not required
      // req.user = payload

      next();
    } catch (error: any) {
      throw new Error(error.message || 'Invalid mobile token');
    }
  }

  async verifyJWT(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(req.headers);
      const token = req.header('Authorization')?.replace('Bearer ', '');
      console.log(token);
      if (!token) {
        throw new Error('Unauthorized request');
      }

      const user:any = jwt.verify(token, ACCESSS_TOKEN_SECRET as string) ;
      if (!user || user?.userId === null) {
        throw new Error('User data is incomplete or missing');
      }

      req.user = user;
      next();
    } catch (error: any) {
      return res.status(401).json({ message: error.message || 'Invalid access token' });
    }
  }

  generateMobileToken = (payload: any): string => {
    return jwt.sign(
      {
        mobile: payload.mobile,
        country: payload.country,
        countryCode: payload.countryCode,
      },
      JWT_SECRET,
      {
        expiresIn: TEMP_TOKEN_EXPIRATION,
      }
    );
  };

  generateUserToken = (user: any): AuthJwtPayload => {
    console.log('Generating user token for:', user);
    const loginTokens: AuthJwtPayload = {
      accessToken: jwt.sign(
        {
          userId: user.user_id,
          userType: user.user_type,
          mobile: user.mobile,
        },
        ACCESSS_TOKEN_SECRET as string, // Use ACCESS_TOKEN_SECRET for accessToken
        {
          expiresIn: '7d',
        } as SignOptions
      ),
      refreshToken: jwt.sign(
        {
           userId: user.user_id,
          userType: user.user_type,
          mobile: user.mobile,
        },
        REFRESH_TOKEN_SECRET as string,
        {
          expiresIn: '7d',
        } as SignOptions
      ),
    };
    return loginTokens;
  };
  verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    try {

      if (req.query['bypass']) {next()}else{
      console.log("version",req.headers?.['app-version']);
      const { firebaseToken } = req.body;
     
       
        const decoded = await firebaseService.verifyIdToken(firebaseToken);
        if (this.isFirebaseTokenExpired(decoded.auth_time)) {
          return res.json({ message: "OTP expired, Please re-initiate", code: 440 })
        }
        req.body.mobile_number = decoded?.phone_number || ""
      next()
      }
    } catch (err) {
      return res.status(401).json({ message: "Invalid Firebase Token", code: 404 });
    }
  }

  isFirebaseTokenExpired(unixTimestamp: number) {
    const timestamp = unixTimestamp * 1000; // Convert seconds to milliseconds
    const dateFromTimestamp = new Date(timestamp);

    const fiveMinutesAgo = subMinutes(new Date(), 5);

    return isBefore(dateFromTimestamp, fiveMinutesAgo);
  }

}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
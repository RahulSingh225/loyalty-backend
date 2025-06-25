
import { Request, Response } from 'express';
import UserRepository from '../repository/user.repository';



class AuthController{
  constructor(private userService: UserRepository) {}


    /**
     * @swagger
     * /auth/create:
     *   post:
     *     summary: Create a new user (retailer or distributor)
     *     description: |
     *       Handles user creation based on the provided user type in the request body.
     *       - If `user_type` is 'retailer', calls `userService.onBoardRetailer` to onboard a retailer.
     *       - If `user_type` is 'distributor', calls `userService.onboardDistributor` to onboard a distributor.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - user_type
     *             properties:
     *               user_type:
     *                 type: string
     *                 enum: [retailer, distributor]
     *                 description: The type of user to create.
     *               # Add other user fields here as needed
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               # Define user response schema here
     *       400:
     *         description: Bad request, missing or invalid user_type
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    /**
     * Handles user creation based on the provided user type in the request body.
     * 
     * - If `user_type` is 'retailer', calls `userService.onBoardRetailer` to onboard a retailer.
     * - If `user_type` is 'distributor', calls `userService.onboardDistributor` to onboard a distributor.
     * - Returns a 400 Bad Request if `user_type` is missing or invalid.
     * 
     * @param req - Express request object containing the user payload in the body.
     * @param res - Express response object used to send the response.
     * @returns A JSON response with the created user data or an error message.
     */
    async createUser(req:Request, res:Response) {
      try {
        const payload = req.body;

        if( !payload || !payload.user_type) {
          return res.status(400).json({ message: 'Bad request, user_type is required' });
        }
        if (payload.user_type === 'retailer') {
        const newUser = await this.userService.onBoardRetailer(payload);
        return res.status(201).json(newUser);
        } else if (payload.user_type === 'distributor') {
        const newUser = await this.userService.onboardDistributor(payload);
        return res.status(201).json(newUser);
        } else {
        return res.status(400).json({ message: 'Bad request, invalid user_type' });
        }
      
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({ message: 'Bad request', error });
      }
    }


      /**
       * Handles user login requests.
       *
       * Expects a request body containing `mobile_number` and `fcm_token`.
       * If either field is missing, responds with HTTP 400 and an error message.
       * Otherwise, attempts to log in the user using the provided credentials via `userService.loginUser`.
       * On success, responds with HTTP 200 and the user data.
       * On failure, responds with HTTP 400 and an error message.
       *
       * @param req - Express request object containing the login payload.
       * @param res - Express response object used to send the response.
       * @returns A JSON response with user data or an error message.
       */
      async loginUser(req:Request, res:Response) {
        try {
            const payload = req.body;
            if (!payload || !payload.mobile_number || !payload.fcm_token) {
                return res.status(400).json({ message: 'Bad request, mobile_number and fcm_token are required' });
            }
            const user = await this.userService.loginUser(payload);
            return res.status(200).json(user);
        } catch (error) {
          console.error('Login error:', error);
            res.status(400).json({ message:error.message, error });
        }
    }
    
}

export default AuthController;
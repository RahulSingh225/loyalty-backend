import UserRepository from "../repository/user.repository";
import { Request,Response } from "express";
class UserController {
  constructor(private userService: UserRepository) {}

  async getUserById(req:Request, res:Response) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }

/**
 * Handles the creation of a new user based on the provided payload.
 * 
 * This method expects a `user_type` field in the request body, which determines
 * the onboarding process:
 * - If `user_type` is 'retailer', it calls `onBoardRetailer` on the user service.
 * - If `user_type` is 'distributor', it calls `onboardDistributor` on the user service.
 * 
 * Responds with:
 * - 201 and the created user object on success.
 * - 400 if the `user_type` is missing or invalid, or if an error occurs.
 * 
 * @param req - Express request object containing the user payload in the body.
 * @param res - Express response object used to send the HTTP response.
 * @returns A JSON response with the created user or an error message.
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
      res.status(400).json({ message: 'Bad request', error });
    }
  }

  

}

export default UserController;
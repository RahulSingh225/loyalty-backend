import { InferColumnsDataTypes } from "drizzle-orm";
import UserRepository from "../repository/user.repository";
import { Request, Response } from "express";

class UserController {
  constructor(private userService: UserRepository) {}

  async getUserById(req: Request, res: Response) {
    try {
      // Extract authenticated user from JWT (set by middleware)
      const authUser = req.user as { id: string; user_type: string };
      if (!authUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const requestedUserId = req.params.id;
      const authUserId = authUser.id;
      const authUserType = authUser.user_type;

      // Access control logic based on user type
      let hasAccess = false;

      if (authUserType === "retailer") {
        // Retailer can only view their own profile
        hasAccess = requestedUserId === authUserId;
      } else if (authUserType === "distributor") {
        // Distributor can view their own profile or any retailer's
        if (requestedUserId === authUserId) {
          hasAccess = true;
        } else {
          // Check if the requested user is a retailer
          const requestedUser = await this.userService.getUserById(
            requestedUserId
          );
          if (requestedUser && requestedUser.user_type === "retailer") {
            hasAccess = true;
          }
        }
      } else if (authUserType === "sales") {
        // Sales can view their own, any distributor's, or any retailer's profile
        if (requestedUserId === authUserId) {
          hasAccess = true;
        } else {
          // Check if the requested user is a distributor or retailer
          const requestedUser = await this.userService.getUserById(
            requestedUserId
          );
          if (
            requestedUser &&
            (requestedUser.user_type === "distributor" ||
              requestedUser.user_type === "retailer")
          ) {
            hasAccess = true;
          }
        }
      } else {
        return res.status(403).json({ message: "Invalid user type" });
      }

      // If no access, return forbidden
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      // Fetch and return the user data
      const user = await this.userService.getUserById(requestedUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
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
  async createUser(req: Request, res: Response) {
    try {
      const payload = req.body;

      if (!payload || !payload.user_type) {
        return res
          .status(400)
          .json({ message: "Bad request, user_type is required" });
      }
      if (payload.user_type === "retailer") {
        const newUser = await this.userService.onBoardRetailer(payload);
        return res.status(201).json(newUser);
      } else if (payload.user_type === "distributor") {
        const newUser = await this.userService.onboardDistributor(payload);
        return res.status(201).json(newUser);
      } else {
        return res
          .status(400)
          .json({ message: "Bad request, invalid user_type" });
      }
    } catch (error) {
      res.status(400).json({ message: "Bad request", error });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const users = await this.userService.listUsers(req.query);
      return res.status(200).json(users);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
    }
  }
}

export default UserController;

import { userRepository } from "../repository";
import AuthController from "./auth.controller";
import UserController from "./user.controller";


export const userController = new UserController(userRepository);
export const authController = new AuthController(userRepository);

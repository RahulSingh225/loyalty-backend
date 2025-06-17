import { earningRepository, redemptionRepository, schemeRepository, userRepository } from "../repository";
import AuthController from "./auth.controller";
import EarningController from "./earning.controller";
import RedemptionController from "./redemption.controller";
import SchemeController from "./scheme.controller";
import UserController from "./user.controller";

export const userController = new UserController(userRepository);
export const authController = new AuthController(userRepository);
export const earningController = new EarningController(earningRepository);
export const redemptionController = new RedemptionController(
  redemptionRepository
);
export const schemeController = new SchemeController(schemeRepository);

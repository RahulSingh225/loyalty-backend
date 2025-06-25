import { contentRepository, earningRepository, redemptionRepository, schemeRepository, userRepository } from "../repository";
import { FileService } from "../services/file.service";
import AuthController from "./auth.controller";
import ContentController from "./content.controller";
import EarningController from "./earning.controller";
import RedemptionController from "./redemption.controller";
import SchemeController from "./scheme.controller";
import UserController from "./user.controller";


const fileService = new FileService();
export const userController = new UserController(userRepository);
export const authController = new AuthController(userRepository);
export const earningController = new EarningController();
export const redemptionController = new RedemptionController(
  
);
export const schemeController = new SchemeController();
export const contentController = new ContentController(contentRepository, fileService);

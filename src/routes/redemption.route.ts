import Router from "express";
import { redemptionController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const redemptionRouter = Router();

const redemptionRoutes = [
  {
    method: "post",
    path: "/placeNew",
    handler: redemptionController.createRedemption,
  },
 
  {
    method: "get",
    path: "/gifts",
    handler: redemptionController.showRewards,
  },
 
  {
    method: "get",
    path: "/redemptions/:id",
    handler: redemptionController.getRedemptionDetails,
  },
];

redemptionRoutes.forEach((route) => {
  redemptionRouter[route.method](route.path, route.handler);
});
redemptionRouter.get(
  "/list",
  authMiddleware.verifyJWT,
  redemptionController.getRedemptions.bind(redemptionController)
);
export default redemptionRouter;

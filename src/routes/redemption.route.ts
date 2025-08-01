import Router from "express";
import { redemptionController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const redemptionRouter = Router();

const redemptionRoutes = [
 
 
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

redemptionRouter.post('/placeNew',
  authMiddleware.verifyJWT,
  redemptionController.createRedemption.bind(redemptionController)
);

redemptionRouter.get(
  "/list",
  authMiddleware.verifyJWT,
  redemptionController.getRedemptions.bind(redemptionController)
);


export default redemptionRouter;

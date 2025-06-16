import Router from "express";

const redemptionRouter = Router();

const redemptionRoutes = [
  {
    method: "post",
    path: "/redemptions",
    handler: redemptionController.createRedemption,
  },
  {
    method: "get",
    path: "/redemptions",
    handler: redemptionController.getRedemptions,
  },
  {
    method: "put",
    path: "/redemptions/:id",
    handler: redemptionController.updateRedemption,
  },
  {
    method: "delete",
    path: "/redemptions/:id",
    handler: redemptionController.deleteRedemption,
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

export default redemptionRouter;

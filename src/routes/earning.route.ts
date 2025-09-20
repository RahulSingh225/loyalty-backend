 import { Router } from "express";
// import { earningController } from "../controllers";

import { earningController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

 const earningRouter = Router();

 earningRouter.post(
  "/pointsTransfer",
  authMiddleware.verifyJWT,
  earningController.initiateEarning.bind(earningController)
);

 earningRouter.get(
  "/pointsTransfer",
  authMiddleware.verifyJWT,
  earningController.getTransferHistory.bind(earningController)
);

// const earningRoutes = [
//   {
//     method: "post",
//     path: "/pointsTransfer",
//     handler: earningController.initiateEarning,
//   }]
//   //{ method: "get", path: "/earnings", handler: earningController.getEarnings }];
// //   {
// //     method: "put",
// //     path: "/earnings/:id",
// //     handler: earningController.updateEarning,
// //   },
// //   {
// //     method: "delete",
// //     path: "/earnings/:id",
// //     handler: earningController.deleteEarning,
// //   },
// //   {
// //     method: "get",
// //     path: "/earnings/:id",
// //     handler: earningController.getEarningDetails,
// //   },
// // ];

// earningRoutes.forEach((route) => {
//   earningRouter[route.method](route.path, route.handler);
// });

export default earningRouter;

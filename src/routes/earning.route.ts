 import { Router } from "express";
// import { earningController } from "../controllers";

import { earningController } from "../controllers";

 const earningRouter = Router();

const earningRoutes = [
  {
    method: "post",
    path: "/pointsTransfer",
    handler: earningController.initiateEarning,
  }]
  //{ method: "get", path: "/earnings", handler: earningController.getEarnings }];
//   {
//     method: "put",
//     path: "/earnings/:id",
//     handler: earningController.updateEarning,
//   },
//   {
//     method: "delete",
//     path: "/earnings/:id",
//     handler: earningController.deleteEarning,
//   },
//   {
//     method: "get",
//     path: "/earnings/:id",
//     handler: earningController.getEarningDetails,
//   },
// ];

earningRoutes.forEach((route) => {
  earningRouter[route.method](route.path, route.handler);
});

export default earningRouter;

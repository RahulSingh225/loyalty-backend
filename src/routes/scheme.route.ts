import Router from "express";
import { schemeController } from "../controllers";
const schemeRouter = Router();

const schemeRoutes = [
  // { method: "post", path: "/schemes", handler: schemeController.createScheme },
  { method: "get", path: "/", handler: schemeController.getSchemes },
  // {
  //   method: "put",
  //   path: "/schemes/:id",
  //   handler: schemeController.updateScheme,
  // },
  // {
  //   method: "delete",
  //   path: "/schemes/:id",
  //   handler: schemeController.deleteScheme,
  // },
  // {
  //   method: "get",
  //   path: "/schemes/:id",
  //   handler: schemeController.getSchemeEarnings,
  // },
];

schemeRoutes.forEach((route) => {
  schemeRouter[route.method](route.path, route.handler);
});

export default schemeRouter;

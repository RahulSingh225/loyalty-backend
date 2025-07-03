import authRouter from "./auth.route";
import contentRouter from "./content.route";
import schemeRouter from "./scheme.route";
import transactionRouter from "./transaction.route";
import userRouter from "./user.route";
import redemptionRouter from "./redemption.route";
import path from "path";
import earningRouter from "./earning.route";


export const routers:any[] = [
  { path: "/auth", router: authRouter },
  { path: "/earning", router: earningRouter },
  { path: "/user", router: userRouter },
  {path:"/content",router:contentRouter},
  {path:"/schemes",router:schemeRouter},
  {path:'/transaction',router:transactionRouter},
  {path:'/redemption',router:redemptionRouter}
  
];

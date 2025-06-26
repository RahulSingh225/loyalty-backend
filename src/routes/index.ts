import authRouter from "./auth.route";
import contentRouter from "./content.route";
import schemeRouter from "./scheme.route";
import userRouter from "./user.route";



export const routers:any[] = [
  { path: "/auth", router: authRouter },
  
  { path: "/user", router: userRouter },
  {path:"/content",router:contentRouter},
  {path:"/schemes",router:schemeRouter}
  
];

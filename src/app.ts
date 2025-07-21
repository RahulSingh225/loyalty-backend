import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routers } from "./routes";



import { RedisClient } from "./services/redis.service";
//import { initializeAgent } from "./utills/serverAgent";
import logger from "./services/logger.service";
import NavisionService from "./services/navision.service";
//import NavisionService from "./services/navision.service";

class App {
  private app: Application;
  private redisClient!: RedisClient;

  constructor() {
    this.app = express();
    this.loadEnvironmentVariables();
    this.initializeFileService();
    this.corsConfig();
    this.initializeMiddleware();
    //initializeAgent(logger);
    this.setupRoutes();
  }

  private loadEnvironmentVariables(): void {
    dotenv.config();
  }

//   private connectToDatabase(): void {
//     this.db = DatabaseService.getInstance({
//       connectionString: process.env.DATABASE_URL,
//     });

//     this.db.connect();
//   }

 

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      
      next();
    });
  }

  private initializeFileService(): void {
    // const config = {
    //   accessKey: AWS_ACCESS_KEY_ID,
    //   secrectKey: AWS_SECRET_ACCESS_KEY,
    //   bucketName: AWS_BUCKET_NAME,
    //   region: AWS_REGION,
    // };
    // FileMiddleware.initialize(config);
  }

//   private async initializeRedis(): Promise<void> {
//     this.redisClient = new RedisClient();
//     await this.redisClient.initialize();
//   }

  private setupRoutes(): void {
  routers.forEach((router) => {
    this.app.use(router.path, router.router);
  });
  }

  private corsConfig() {
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Specify allowed HTTP methods
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
        ],
      })
    );
    this.app.options("*", cors());
  }

//   private errorHandler() {
//     this.app.use(errorHandler.errorHandleMiddleware);
//   }

//   private logger(): void {
//     this.app.use(loggerMiddleware.apiLogger);
//   }

  public listen(port: number): void {
    this.app.get("/",(req:Request,res,Response)=>{

    res.send("Hellooo");

})


 this.app.get("/sync",async (req:Request,res,Response)=>{

    const nav = new NavisionService();
   // await nav.syncCustomer();
    await nav.syncRetail()
    //await nav.syncNotifyCustomer()
     //await nav.syncSalesLedger()
    //   await nav.syncSalesClaimTransfer()
    // await nav.syncSalesPersonList()
     //await nav.syncRetailerReward();
     //await nav.syncRedemptionRequest();
     //await nav.syncVendor()
    //await nav.totalPoints();
    //await nav.claimPoints();
    //await nav.balancePoints();
    //await nav.mapSalesPerson();
    //await nav.onboardSalesPerson();
    //await nav.mapDist2()


    res.send("Donee")

})
    // Your routes and middleware here–…
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', database: 'connected' });
    });

    
    this.app.listen(port,'0.0.0.0', () => {
      console.log(`\nServer is running on port number : ${port} 🚀🚀🚀\n`);
    });
  }
}

// Export the App class for use in other modules
export default App;
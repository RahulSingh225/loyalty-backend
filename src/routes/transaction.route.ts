import {Router} from 'express'
import { transactionController } from '../controllers'
import { authMiddleware } from '../middleware/auth.middleware'




 const transactionRouter:Router = Router()

transactionRouter.get('/passbook',authMiddleware.verifyJWT,(req,res)=>transactionController.getPassbook(req,res))
//transactionRouter.post('/')
transactionRouter.post('/updateTransaction',authMiddleware.verifyAPIKey,(req,res)=>transactionController.updateTransaction(req,res))
export default transactionRouter
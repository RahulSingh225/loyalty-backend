import {Router} from 'express'
import { transactionController } from '../controllers'




 const transactionRouter:Router = Router()

transactionRouter.get('/passbook',(req,res)=>transactionController.getPassbook(req,res))
//transactionRouter.post('/')

export default transactionRouter
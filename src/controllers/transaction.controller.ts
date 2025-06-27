import TransactionRepository from "../repository/transaction.repository";



export default class TransactionController {
private transactionRepository

    constructor(){
        
this.transactionRepository = new TransactionRepository()

    }

    async getPassbook(req,res){
        
        try {
            console.log(this.transactionRepository)
 const result = await this.transactionRepository.getPassbook(1)
        res.json({success:true,data:result})

        }catch(error){
            console.log(error)
            res.status(500).json({success:false,message:'Internal Server Error'})
        }
       
    }
}
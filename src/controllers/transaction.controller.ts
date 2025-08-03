import TransactionRepository from "../repository/transaction.repository";



export default class TransactionController {
private transactionRepository

    constructor(){
        
this.transactionRepository = new TransactionRepository()

    }

    async getPassbook(req,res){
        
        try {

            const userId = req.user;
            
 const result = await this.transactionRepository.getPassbook(userId)
        res.json({success:true,data:result})

        }catch(error){
            console.log(error)
            res.status(500).json({success:false,message:'Internal Server Error'})
        }
       
    }

    async updateTransaction(req, res) {
        try {
            const transactionData = req.body;
            if(transactionData && !transactionData.documentNo || !transactionData.status) {
                return res.status(400).json({ success: false, message: 'Invalid transaction data' });
            }

            const updatedTransaction = await this.transactionRepository.updateNavisionEntry(transactionData);
            res.json({ success: true, data: updatedTransaction });
        } catch (error) {
            console.error('Error updating transaction:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}
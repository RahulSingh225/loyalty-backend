import { eq,and,or } from "drizzle-orm"
import { salesPointLedgerEntry,retailer,distributor, salesperson, salesPointsClaimTransfer } from "../db/schema"
import { db } from "../services/db.service"
import { GlobalState } from "../configs/config"
import NavisionService from "../services/navision.service";

export default class TransactionRepository {

    constructor(){

    }

    async getPassbook(userId:any){
      let userCode;
      switch (userId.userType) {
        case 'retailer':
          userCode = await db.select().from(retailer).where(eq(retailer.userId,userId.userId))
          break;
        case 'distributor':
          userCode = await db.select().from(distributor).where(eq(distributor.userId,userId.userId))
          break;
        case 'sales':
          userCode = await db.select().from(salesperson).where(eq(salesperson.userId,userId.userId))
          break;
        default:
          throw new Error('Invalid user type');
      }
      const result = await db.select().from(salesPointLedgerEntry).where(and(
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        or(
          eq(salesPointLedgerEntry.customerNo,userCode[0].navisionId),
          eq(salesPointLedgerEntry.retailerNo,userCode[0].navisionId),
          eq(salesPointLedgerEntry.notifyCustomerNo,userCode[0].navisionId) ,
          eq(salesPointLedgerEntry.agentCode,userCode[0].navisionId)
          
        ),
        eq(salesPointLedgerEntry.customerIsAgent,false)
      ))

console.log(result.length)
      return result.map((entry) => ({
       userType: userId.userType,
       status:'completed',
        processedAt: entry.createdAt,
        firstParty: userId.userType =='retailer'? entry.customerName || entry.retailerName || entry.notifyCustomerName:entry.agentName,
        secondParty: userId.userType =='retailer'?entry.agentName:entry.customerName || entry.retailerName || entry.notifyCustomerName,
        documentType: entry.documentType,
        entryType: Number(entry.salesPoints)>0?'CREDIT':'DEBIT',
        points: entry.salesPoints
      }))




        
    }


    async updateNavisionEntry(transactionData:any){
      const { documentNo, status } = transactionData;

      // Validate input
      if (!documentNo  || !status) {
        throw new Error('Invalid transaction data');
      }

      // Update the entry in the database
      const result = await db.update(salesPointsClaimTransfer)
        .set({ status: status })
        .where(
          eq(salesPointsClaimTransfer.documentNo, documentNo)
        )
        .returning();
       
        
      if (result.length === 0) {
        throw new Error('Entry not found');
      }
//  const nav = new NavisionService();
//  await nav.distributorPoints();
//  await nav.totalPoints();
// await nav.claimPoints();
// await nav.balancePoints();
      return result[0];
    }
    

}
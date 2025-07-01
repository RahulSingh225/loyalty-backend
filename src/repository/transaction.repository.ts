import { eq,and,or } from "drizzle-orm"
import { salesPointLedgerEntry,retailer } from "../db/schema"
import { db } from "../services/db.service"
import { GlobalState } from "../configs/config"

export default class TransactionRepository {

    constructor(){

    }

    async getPassbook(userId:number){
      const retail = await db.select().from(retailer).where(eq(retailer.userId,userId))
      const result = await db.select().from(salesPointLedgerEntry).where(and(
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        or(
          eq(salesPointLedgerEntry.customerNo,retail[0].navisionId),
          eq(salesPointLedgerEntry.retailerNo,retail[0].navisionId),
          eq(salesPointLedgerEntry.notifyCustomerNo,retail[0].navisionId) 
        )
      ))


      return result.map((entry) => ({
       userType: 'retailer',
       status:'completed',
        processedAt: entry.createdAt,
        firstParty: entry.customerName || entry.retailerName || entry.notifyCustomerName,
        secondParty: entry.agentName,
        documentType: entry.documentType,
        entryType: Number(entry.salesPoints)>0?'CREDIT':'DEBIT',
        points: entry.salesPoints
      }))




        
    }

}
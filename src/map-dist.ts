import { eq, sql } from "drizzle-orm";
import { distributor, navisionCustomerMaster, navisionRetailMaster, retailer } from "./db/schema";
import { db } from "./services/db.service";




async function mapDist(){

    const navision = await db.select({navId:retailer.navisionId}).from(retailer)

    for await (let n of navision){
        const naventry = await db.select().from(navisionRetailMaster).where(eq(navisionRetailMaster.no,n.navId))
        if(naventry.length){

 const distEntry = await db.select().from(distributor).where(eq(distributor.navisionId,naventry[0].agentCode))
 if(distEntry.length)await db.update(retailer).set({distributorId:distEntry[0].distributorId})

        }
       
    }
}

mapDist()
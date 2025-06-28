
import { and, eq, isNotNull, ne, sql, sum } from "drizzle-orm";
import { userMaster,retailer, navisionRetailMaster, navisionCustomerMaster, navisionNotifyCustomer, distributor, salesPointLedgerEntry, salesPointsClaimTransfer } from "./db/schema";
import { db } from "./services/db.service";

async function totalPoints() {
  try {
    const retailresult = await db
      .select({
        retailerNo: salesPointLedgerEntry.retailerNo,
        totalSalesPoints: sum(salesPointLedgerEntry.salesPoints).as('total_sales_points'),
      })
      .from(salesPointLedgerEntry)
      .where(
        and(
          ne(salesPointLedgerEntry.documentType, 'Claim'),
          isNotNull(salesPointLedgerEntry.retailerNo)
        )
      )
      .groupBy(salesPointLedgerEntry.retailerNo);

      const cusotmerresult = await db
      .select({
        customerNo: salesPointLedgerEntry.customerNo,
        totalSalesPoints: sum(salesPointLedgerEntry.salesPoints).as('total_sales_points'),
      })
      .from(salesPointLedgerEntry)
      .where(
        and(
          ne(salesPointLedgerEntry.documentType, 'Claim'),
          isNotNull(salesPointLedgerEntry.customerNo)
        )
      )
      .groupBy(salesPointLedgerEntry.customerNo);


      const notifyresult = await db
      .select({
        notifyCustomerNo: salesPointLedgerEntry.notifyCustomerNo,
        totalSalesPoints: sum(salesPointLedgerEntry.salesPoints).as('total_sales_points'),
      })
      .from(salesPointLedgerEntry)
      .where(
        and(
          ne(salesPointLedgerEntry.documentType, 'Claim'),
          isNotNull(salesPointLedgerEntry.notifyCustomerNo)
        )
      )
      .groupBy(salesPointLedgerEntry.notifyCustomerNo);

      for await (let n of notifyresult){
        await db.update(retailer).set({totalPoints:Number(n.totalSalesPoints)}).where(eq(retailer.navisionId,n.notifyCustomerNo))
        
      }
       for await (let c of cusotmerresult){
        await db.update(retailer).set({totalPoints:Number(c.totalSalesPoints)}).where(eq(retailer.navisionId,c.customerNo))
        
      }
       for await (let r of retailresult){
        await db.update(retailer).set({totalPoints:Number(r.totalSalesPoints)}).where(eq(retailer.navisionId,r.retailerNo))
        
      }
await db
      .update(userMaster)
      .set({
        totalPoints: sql`(SELECT ${retailer.totalPoints} FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`
      })
      .where(
        sql`EXISTS (SELECT 1 FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`
      );
    
  } catch (error) {
    console.error('Error syncing retailer navision IDs:', error);
    throw new Error(`Failed to sync retailer navision IDs: ${error.message}`);
  }
}
async function claimPoints() {
  try {
    // Merge points from all three sources (retailerNo, customerNo, notifyCustomerNo)
    const mergedPoints = await db
      .select({
        id: sql`navision_id`.as('id'),
        totalPoints: sql`SUM(total_points)`.as('totalPoints'),
      })
      .from(
        sql`(SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.retailerNo}
             UNION ALL
             SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
             FROM ${salesPointsClaimTransfer}
             WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
               AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
               AND ${salesPointsClaimTransfer.lineType} = 'Header'
               AND ${salesPointsClaimTransfer.status} = 'Submitted'
             GROUP BY ${salesPointsClaimTransfer.retailerNo}
             UNION ALL
             SELECT ${salesPointLedgerEntry.customerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.customerNo}
             UNION ALL
             SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
             FROM ${salesPointsClaimTransfer}
             WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
               AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
               AND ${salesPointsClaimTransfer.lineType} = 'Header'
               AND ${salesPointsClaimTransfer.status} = 'Submitted'
             GROUP BY ${salesPointsClaimTransfer.customerNo}
             UNION ALL
             SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.notifyCustomerNo}
             UNION ALL
             SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
             FROM ${salesPointsClaimTransfer}
             WHERE ${salesPointsClaimTransfer.notifyCustomer} tropes IS NOT NULL
               AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
               AND ${salesPointsClaimTransfer.lineType} = 'Header'
               AND ${salesPointsClaimTransfer.status} = 'Submitted'
             GROUP BY ${salesPointsClaimTransfer.notifyCustomer}) AS combined`
      )
      .groupBy(sql`navision_id`);

    // Update retailer.consumedPoints
    await db
      .update(retailer)
      .set({
        consumedPoints: sql`(SELECT SUM(total_points) FROM (
          SELECT navision_id, total_points
          FROM (
            SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
            GROUP BY ${salesPointLedgerEntry.retailerNo}
            UNION ALL
            SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            GROUP BY ${salesPointsClaimTransfer.retailerNo}
            UNION ALL
            SELECT ${salesPointLedgerEntry.customerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
            GROUP BY ${salesPointLedgerEntry.customerNo}
            UNION ALL
            SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            GROUP BY ${salesPointsClaimTransfer.customerNo}
            UNION ALL
            SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
            GROUP BY ${salesPointLedgerEntry.notifyCustomerNo}
            UNION ALL
            SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            GROUP BY ${salesPointsClaimTransfer.notifyCustomer}
          ) AS points
          WHERE points.navision_id = ${retailer.navisionId}
        ) AS combined)`,
      })
      .where(
        sql`EXISTS (
          SELECT 1 FROM (
            SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
            UNION
            SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            UNION
            SELECT ${salesPointLedgerEntry.customerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
            UNION
            SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            UNION
            SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
            UNION
            SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
          ) AS combined WHERE combined.navision_id = ${retailer.navisionId}
        )`
      );

    // Update user_master.total_points based on retailer.totalPoints
    await db
      .update(userMaster)
      .set({
        redeemedPoints: sql`(SELECT ${retailer.consumedPoints} FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`,
      })
      .where(
        sql`EXISTS (SELECT 1 FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`
      );

    console.log('Successfully synced points and updated retailer and user_master');
    return { mergedPoints };
  } catch (error) {
    console.error('Error syncing retailer navision IDs:', error);
    throw new Error(`Failed to sync retailer navision IDs: ${error.message}`);
  }
}
claimPoints()
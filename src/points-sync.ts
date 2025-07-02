
import { and, eq, isNotNull, ne, sql, sum } from "drizzle-orm";
import { userMaster,retailer, navisionRetailMaster, navisionCustomerMaster, navisionNotifyCustomer, distributor, salesPointLedgerEntry, salesPointsClaimTransfer } from "./db/schema";
import { db } from "./services/db.service";
import { GlobalState } from "./configs/config";

interface MergedPoint {
  id: string; // Adjust type if navision_id is a number
  totalPoints: number;
}

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
        await db.update(retailer).set({totalPoints:(n.totalSalesPoints)}).where(eq(retailer.navisionId,n.notifyCustomerNo))
        
      }
       for await (let c of cusotmerresult){
        await db.update(retailer).set({totalPoints:(c.totalSalesPoints)}).where(eq(retailer.navisionId,c.customerNo))
        
      }
       for await (let r of retailresult){
        await db.update(retailer).set({totalPoints:(r.totalSalesPoints)}).where(eq(retailer.navisionId,r.retailerNo))
        
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
    // Step 1: Merge points from sales_point_ledger_entry (and optionally sales_points_claim_transfer)
    console.log('Fetching merged points...');
    const mergedPointsQuery = await db
      .select({
        id: sql`navision_id`.as('id'),
        totalPoints: sql`ABS(SUM(total_points))`.as('totalPoints'),
      })
      .from(
        sql`(SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.retailerNo}
             UNION ALL
             SELECT ${salesPointLedgerEntry.customerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.customerNo}
             UNION ALL
             SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
             FROM ${salesPointLedgerEntry}
             WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
             GROUP BY ${salesPointLedgerEntry.notifyCustomerNo}
             
             UNION ALL
             SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id, 
       SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
FROM ${salesPointsClaimTransfer}
WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
  AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
  AND ${salesPointsClaimTransfer.status} = 'Submitted'
  AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  AND ${salesPointsClaimTransfer.documentNo} = (
    SELECT ${salesPointsClaimTransfer.documentNo}
    FROM ${salesPointsClaimTransfer}
    WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
      AND ${salesPointsClaimTransfer.status} = 'Submitted'
      AND ${salesPointsClaimTransfer.lineType} = 'Header'
      AND ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
      AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  )
GROUP BY ${salesPointsClaimTransfer.retailerNo};
             UNION ALL
             SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id, 
       SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
FROM ${salesPointsClaimTransfer}
WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
  AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
  
  AND ${salesPointsClaimTransfer.status} = 'Submitted'
  AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  AND ${salesPointsClaimTransfer.documentNo} = (
    SELECT ${salesPointsClaimTransfer.documentNo}
    FROM ${salesPointsClaimTransfer}
    WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
      AND ${salesPointsClaimTransfer.status} = 'Submitted'
      AND ${salesPointsClaimTransfer.lineType} = 'Header'
      AND ${salesPointsClaimTransfer.customerNo} IS NOT NULL
      AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  )
GROUP BY ${salesPointsClaimTransfer.customerNo};
             UNION ALL

             SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id, 
       SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
FROM ${salesPointsClaimTransfer}
WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
  AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
  
  AND ${salesPointsClaimTransfer.status} = 'Submitted'
  AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  AND ${salesPointsClaimTransfer.documentNo} = (
    SELECT ${salesPointsClaimTransfer.documentNo}
    FROM ${salesPointsClaimTransfer}
    WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
      AND ${salesPointsClaimTransfer.status} = 'Submitted'
      AND ${salesPointsClaimTransfer.lineType} = 'Header'
      AND ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
      AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
  )
GROUP BY ${salesPointsClaimTransfer.notifyCustomer};

             ) AS combined`
      )
      .groupBy(sql`navision_id`);
const mergedPoints: MergedPoint[] = mergedPointsQuery as unknown as MergedPoint[];
    console.log('Merged points:', JSON.stringify(mergedPoints, null, 2));
    if (!mergedPoints || mergedPoints.length === 0) {
      console.warn('No merged points found. Check source data in sales_point_ledger_entry.');
      return { mergedPoints: [] };
    }

    // Step 2: Check navision_id matches in retailer table
    console.log('Checking navision_id matches in retailer table...');
    const retailerIds = await db
      .select({ navisionId: retailer.navisionId })
      .from(retailer);
    console.log('Retailer navisionIds:', retailerIds.map(r => r.navisionId));

    const navisionIds = mergedPoints.map(p => p.id);
    console.log('Navision IDs from mergedPoints:', navisionIds);
    const matchingIds = retailerIds.filter(r => navisionIds.includes(r.navisionId));
    console.log('Matching navisionIds:', matchingIds.map(r => r.navisionId));
    if (matchingIds.length === 0) {
      console.warn('No matching navisionIds found. Retailer update will not occur.');
    }

    // Step 3: Update retailer.consumedPoints
    console.log('Updating retailer consumedPoints...');
    const retailerUpdateResult = await db
      .update(retailer)
      .set({
        consumedPoints: sql`(SELECT ABS(SUM(total_points)) FROM (
          SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
          FROM ${salesPointLedgerEntry}
          WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
            AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
          GROUP BY ${salesPointLedgerEntry.retailerNo}
          UNION ALL
          SELECT ${salesPointLedgerEntry.customerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
          FROM ${salesPointLedgerEntry}
          WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
            AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
          GROUP BY ${salesPointLedgerEntry.customerNo}
          UNION ALL
          SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id, SUM(${salesPointLedgerEntry.salesPoints}) AS total_points
          FROM ${salesPointLedgerEntry}
          WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
            AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
          GROUP BY ${salesPointLedgerEntry.notifyCustomerNo}
          -- Uncomment the following if sales_points_claim_transfer is needed
          /*
          UNION ALL
          SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
          FROM ${salesPointsClaimTransfer}
          WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
            AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
            AND ${salesPointsClaimTransfer.lineType} = 'Header'
            AND ${salesPointsClaimTransfer.status} = 'Submitted'
          GROUP BY ${salesPointsClaimTransfer.retailerNo}
          UNION ALL
          SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
          FROM ${salesPointsClaimTransfer}
          WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
            AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
            AND ${salesPointsClaimTransfer.lineType} = 'Header'
            AND ${salesPointsClaimTransfer.status} = 'Submitted'
          GROUP BY ${salesPointsClaimTransfer.customerNo}
          UNION ALL
          SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id, SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
          FROM ${salesPointsClaimTransfer}
          WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
            AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
            AND ${salesPointsClaimTransfer.lineType} = 'Header'
            AND ${salesPointsClaimTransfer.status} = 'Submitted'
          GROUP BY ${salesPointsClaimTransfer.notifyCustomer}
          */
        ) AS points WHERE points.navision_id = ${retailer.navisionId})`,
      })
      .where(
        sql`EXISTS (
          SELECT 1 FROM (
            SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
            UNION
            SELECT ${salesPointLedgerEntry.customerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
            UNION
            SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id
            FROM ${salesPointLedgerEntry}
            WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
              AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
            -- Uncomment the following if sales_points_claim_transfer is needed
            /*
            UNION
            SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            UNION
            SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            UNION
            SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id
            FROM ${salesPointsClaimTransfer}
            WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
              AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
              AND ${salesPointsClaimTransfer.lineType} = 'Header'
              AND ${salesPointsClaimTransfer.status} = 'Submitted'
            */
          ) AS combined WHERE combined.navision_id = ${retailer.navisionId}
        )`
      );

    console.log('Retailer update rows affected:', retailerUpdateResult.rowCount);
    if (retailerUpdateResult.rowCount === 0) {
      console.warn('No retailers updated. Check navision_id matches and data in sales_point_ledger_entry.');
    }

    // Step 4: Check userId mappings
    console.log('Checking userId mappings...');
    const retailerUserIds = await db
      .select({ userId: retailer.userId, navisionId: retailer.navisionId })
      .from(retailer);
    console.log('Retailer userIds:', retailerUserIds);

    const userMasterIds = await db
      .select({ userId: userMaster.userId })
      .from(userMaster);
    console.log('UserMaster userIds:', userMasterIds.map(u => u.userId));

    const matchingUserIds = retailerUserIds.filter(r => userMasterIds.some(u => u.userId === r.userId));
    console.log('Matching userIds:', matchingUserIds);
    if (matchingUserIds.length === 0) {
      console.warn('No matching userIds found. User_master update will not occur.');
    }

    // Step 5: Update user_master.redeemedPoints
    console.log('Updating user_master redeemedPoints...');
    const userMasterUpdateResult = await db
      .update(userMaster)
      .set({
        redeemedPoints: sql`(SELECT ${retailer.consumedPoints} FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`,
      })
      .where(
        sql`EXISTS (SELECT 1 FROM ${retailer} WHERE ${retailer.userId} = ${userMaster.userId})`
      );

    console.log('UserMaster update rows affected:', userMasterUpdateResult.rowCount);
    if (userMasterUpdateResult.rowCount === 0) {
      console.warn('No user_master records updated. Check retailer.userId to user_master.userId mappings.');
    }

    console.log('Successfully synced points and updated retailer and user_master');
    return { mergedPoints };
  } catch (error) {
    console.error('Error syncing retailer navision IDs:', error.stack);
    throw new Error(`Failed to sync retailer navision IDs: ${error.message}`);
  }
}
//totalPoints()
claimPoints()
const fs =require('fs');
import { drizzle } from 'drizzle-orm/node-postgres';
import {Pool} from 'pg'
import * as schema from '../src/db/schema'
import { sql, eq, inArray, and } from 'drizzle-orm';
const pool = new Pool({
  connectionString: 'postgresql://dbadmin:Test@123@13.200.12.122:5432/ranjit_loyalty', // e.g. postgres://user:pass@host:port/db
  //ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize drizzle instance
 const db = drizzle(pool, { logger:true,schema })

async function mapDist2() {
  try {
    const result = await db.transaction(async (tx) => {
      // Fetch counts of unique retailers mapped to 'AG0014' in each Navision table
      const retailCountResult = await tx
        .select({ count: sql`COUNT(DISTINCT "No")`.mapWith(Number) })
        .from(schema.navisionRetailMaster)
        .where(eq(schema.navisionRetailMaster.agentCode, 'AG0014'));
      const customerCountResult = await tx
        .select({ count: sql`COUNT(DISTINCT "No")`.mapWith(Number) })
        .from(schema.navisionCustomerMaster)
        .where(eq(schema.navisionCustomerMaster.salesAgent, 'AG0014'));
      const notifyCountResult = await tx
        .select({ count: sql`COUNT(DISTINCT no)`.mapWith(Number) })
        .from(schema.navisionNotifyCustomer)
        .where(eq(schema.navisionNotifyCustomer.salesAgent, 'AG0014'));

      const retailCount = retailCountResult[0].count;
      const customerCount = customerCountResult[0].count;
      const notifyCount = notifyCountResult[0].count;

      // Fetch mappings from Navision tables where agent is 'AG0014'
      const navisionMappings = await tx
        .select({
          no: sql<string>`"No"`,
          agent: sql<string>`"Agent_Code"`,
          source: sql`'retail'`.as('source'),
        })
        .from(schema.navisionRetailMaster)
        .where(eq(schema.navisionRetailMaster.agentCode, 'AG0014'))
        .unionAll(
          tx
            .select({
              no: schema.navisionCustomerMaster.no,
              agent: schema.navisionCustomerMaster.salesAgent,
              source: sql`'customer'`,
            })
            .from(schema.navisionCustomerMaster)
            .where(eq(schema.navisionCustomerMaster.salesAgent, 'AG0014'))
        )
        .unionAll(
          tx
            .select({
              no: schema.navisionNotifyCustomer.no,
              agent: schema.navisionNotifyCustomer.salesAgent,
              source: sql`'notify'`,
            })
            .from(schema.navisionNotifyCustomer)
            .where(eq(schema.navisionNotifyCustomer.salesAgent, 'AG0014'))
        );

      // Create a map of Navision mappings with prioritization
      const navisionMap = new Map();
      for (const mapping of navisionMappings) {
        const normalizedNo = mapping.no?.trim().toUpperCase() ?? '';
        if (!navisionMap.has(normalizedNo) || mapping.source === 'retail') {
          navisionMap.set(normalizedNo, {
            no: normalizedNo,
            agent: mapping.agent?.trim().toUpperCase() ?? '',
            source: mapping.source,
          });
        }
      }

      const mappedNos = Array.from(navisionMap.keys());

      // Fetch only retailers whose navisionId is in mappedNos
      const retailers = await tx
        .select({ navId: schema.retailer.navisionId })
        .from(schema.retailer)
        .where(inArray(sql`UPPER(${schema.retailer.navisionId})`, mappedNos));

      const retailerNavIds = new Set(retailers.map(r => r.navId?.trim().toUpperCase() ?? ''));
      const notPresentInRetailer = mappedNos.filter(no => !retailerNavIds.has(no));

      // Fetch distributor ID for 'AG0014'
      const distributorIds = await tx
        .select({ navisionId: schema.distributor.navisionId })
        .from(schema.distributor)
        .where(eq(schema.distributor.navisionId, 'AG0014'));
      const validDistributorIds = new Set(
        distributorIds.map(d => d.navisionId?.trim().toUpperCase() ?? '')
      );

      // Process updates for relevant retailers
      const updatePromises = [];
      for (const { navId } of retailers) {
        const normalizedNavId = navId?.trim().toUpperCase() ?? '';
        const mapping = navisionMap.get(normalizedNavId);
        if (mapping && validDistributorIds.has(mapping.agent)) {
          const distributorIdQuery = sql`(SELECT distributor_id FROM distributor WHERE navision_id = ${mapping.agent})`;
          const updatePromise = tx
            .update(schema.retailer)
            .set({ distributorId: distributorIdQuery })
            .where(
              and(
                eq(schema.retailer.navisionId, navId),
                sql`EXISTS (SELECT 1 FROM distributor WHERE navision_id = ${mapping.agent})`
              )
            );
          updatePromises.push(updatePromise);
        }
      }

      // Execute updates
      await Promise.all(updatePromises);

      // Return results for logging
      return {
        updatedCount: updatePromises.length,
        notPresentInRetailer,
        retailCount,
        customerCount,
        notifyCount,
        totalMapped: navisionMap.size,
        presentInRetailer: retailers.length,
      };
    });

    // Log results to console
    console.log(`Retailers mapped to 'AG0014' in navisionRetailMaster: ${result.retailCount}`);
    console.log(`Retailers mapped to 'AG0014' in navisionCustomerMaster: ${result.customerCount}`);
    console.log(`Retailers mapped to 'AG0014' in navisionNotifyCustomer: ${result.notifyCount}`);
    console.log(`Total unique retailers mapped to 'AG0014': ${result.totalMapped}`);
    console.log(`Number of these present in retailer table: ${result.presentInRetailer}`);
    console.log(`Number successfully updated: ${result.updatedCount}`);
    console.log(`Retailers not present in retailer table: ${JSON.stringify(result.notPresentInRetailer, null, 2)}`);

    // Write to log file
    const logContent = `
Date: ${new Date().toISOString()}
Retailers mapped to 'AG0014' in navisionRetailMaster: ${result.retailCount}
Retailers mapped to 'AG0014' in navisionCustomerMaster: ${result.customerCount}
Retailers mapped to 'AG0014' in navisionNotifyCustomer: ${result.notifyCount}
Total unique retailers mapped to 'AG0014': ${result.totalMapped}
Number of these present in retailer table: ${result.presentInRetailer}
Number successfully updated: ${result.updatedCount}
Retailers not present in retailer table: ${JSON.stringify(result.notPresentInRetailer, null, 2)}
`;
    fs.writeFileSync('mapDist2_log.txt', logContent);

    return result;
  } catch (error) {
    console.error('Error in mapDist2:', error);
    throw new Error(`Failed to update retailers: ${(error).message}`);
  }
}

interface LogEntry {
  navisionId: string;
  sourceTable: string;
  success: boolean;
  reason: string | null;
  agentCode: string;
  whatsappNo: string;
}

// Define interfaces for table records and OnboardData (assumed based on context)
interface CustomerMaster {
  no: string;
  name: string;
  whatsappNo1: string;
  whatsappNo2?: string;
  address: string;
  address2?: string;
  pANNo?: string;
  gstRegistrationNo?: string;
  postCode?: string;
  city?: string;
  stateCode?: string;
  salesAgent: string;
}

interface NotifyCustomer {
  no: string;
  name?: string;
  whatsappNo?: string;
  whatsappNo2?: string;
  address?: string;
  address2?: string;
  pANNo?: string;
  gstRegistrationNo?: string;
  postCode?: string;
  city?: string;
  stateCode?: string;
  salesAgent?: string;
}

interface RetailMaster {
  no: string;
  shopName?: string;
  whatsappNo?: string;
  whatsappNo2?: string;
  shopAddress?: string;
  address2?: string;
  pANNo?: string;
  aadhaarNo?: string;
  gstRegistrationNo?: string;
  pinCode?: string;
  city?: string;
  state?: string;
  agentCode?: string;
}

interface OnboardData {
  username: string;
  mobile_number: string;
  secondary_mobile_number: string | null;
  password: string;
  shop_name: string;
  shop_address: string | null;
  pan_id: string | null;
  aadhar_id: string | null;
  gst_id: string | null;
  pin_code: string | null;
  city: string | null;
  state: string | null;
  user_type: string;
  fcm_token: string | null;
  navision_id: string;
  device_details: string | null;
}


  async function onboardAllRetailers() {
    try {
      const hashedPassword = 'Test@123';

      // Verify if onboard_retailer function exists
      const checkProcedure = await pool.query(
        `SELECT EXISTS (
          SELECT 1
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'onboard_retailer'
        ) AS exists`
      );
      if (!checkProcedure.rows[0].exists) {
        throw new Error('Stored procedure onboard_retailer does not exist in the public schema');
      }

      // Fetch all data concurrently
      const [customers, notifyCustomers, retailCustomers] = await Promise.all([
        db.select().from(schema.navisionCustomerMaster),
        db.select().from(schema.navisionNotifyCustomer),
        db.select().from(schema.navisionRetailMaster),
      ]);

      // Map functions to convert table records to OnboardData
      const mapCustomerMaster = (c: CustomerMaster): OnboardData => ({
        username: c.name,
        mobile_number: c.whatsappNo1 ?? '',
        secondary_mobile_number: c.whatsappNo2 ?? null,
        password: hashedPassword,
        shop_name: c.name,
        shop_address: c.address,
        pan_id: c.pANNo ?? null,
        aadhar_id: null,
        gst_id: c.gstRegistrationNo ?? null,
        pin_code: c.postCode ?? null,
        city: c.city ?? null,
        state: c.stateCode ?? null,
        user_type: 'retailer',
        fcm_token: null,
        navision_id: c.no,
        device_details: null,
      });

      const mapNotifyCustomer = (n: NotifyCustomer): OnboardData => ({
        username: n.name ?? '',
        mobile_number: n.whatsappNo ?? '',
        secondary_mobile_number: n.whatsappNo2 ?? null,
        password: hashedPassword,
        shop_name: n.name ?? '',
        shop_address: n.address ?? null,
        pan_id: n.pANNo ?? null,
        aadhar_id: null,
        gst_id: n.gstRegistrationNo ?? null,
        pin_code: n.postCode ?? null,
        city: n.city ?? null,
        state: n.stateCode ?? null,
        user_type: 'retailer',
        fcm_token: null,
        navision_id: n.no,
        device_details: null,
      });

      const mapRetailMaster = (r: RetailMaster): OnboardData => ({
        username: r.shopName ?? '',
        mobile_number: r.whatsappNo ?? '',
        secondary_mobile_number: r.whatsappNo2 ?? null,
        password: hashedPassword,
        shop_name: r.shopName ?? '',
        shop_address: r.shopAddress ?? null,
        pan_id: r.pANNo ?? null,
        aadhar_id: r.aadhaarNo ?? null,
        gst_id: r.gstRegistrationNo ?? null,
        pin_code: r.pinCode ?? null,
        city: r.city ?? null,
        state: r.state ?? null,
        user_type: 'retailer',
        fcm_token: null,
        navision_id: r.no,
        device_details: null,
      });

      // Process all tables concurrently and collect results
      const [customerResults, notifyResults, retailResults] = await Promise.all([
        processBatch<CustomerMaster>(customers, mapCustomerMaster, 'navisionCustomerMaster'),
        processBatch<NotifyCustomer>(notifyCustomers, mapNotifyCustomer, 'navisionNotifyCustomer'),
        processBatch<RetailMaster>(retailCustomers, mapRetailMaster, 'navisionRetailMaster'),
      ]);

      // Combine all results
      const allResults: LogEntry[] = [...customerResults, ...notifyResults, ...retailResults];

      // Summarize and log results
      const totalAttempted = allResults.length;
      const successful = allResults.filter(r => r.success).length;
      const failed = allResults.filter(r => !r.success);
            const logContent = `
Date: ${new Date().toISOString()}
Total attempted: ${totalAttempted}
Successfully onboarded: ${successful}
Failed to onboard: ${failed.length}
${failed.length > 0 ? 'Details of failed onboardings:\n' + failed.map(fail => 
  `Navision ID: ${fail.navisionId}, Source: ${fail.sourceTable}, Reason: ${fail.reason}, Agent Code: ${fail.agentCode}, WhatsApp No: ${fail.whatsappNo}`
).join('\n') : ''}
`;

      // Write to log file
      fs.writeFileSync('onboardAllRetailers_log.txt', logContent);

      console.log(`Total attempted: ${totalAttempted}`);
      console.log(`Successfully onboarded: ${successful}`);
      console.log(`Failed to onboard: ${failed.length}`);

      // if (failed.length > 0) {
      //   console.log('Details of failed onboardings:');
      //   for (const fail of failed) {

          
      //     console.log(
      //       `Navision ID: ${fail.navisionId}, Source: ${fail.sourceTable}, Reason: ${fail.reason}, Agent Code: ${fail.agentCode}, WhatsApp No: ${fail.whatsappNo}`
      //     );
      //   }
      // }

      console.log('✅ Bulk Bulk onboarding complete');
    } catch (err: any) {
      console.error('❌ Error during onboarding:', err.message);
      throw err;
    } finally {
      await pool.end(); // Close the connection pool
    }
  }

  // Modified processBatch to return detailed log entries
  async function processBatch<T>(
    items: T[],
    mapFunction: (item: T) => OnboardData,
    sourceTable: string
  ): Promise<LogEntry[]> {
    const results: LogEntry[] = [];

    for (const item of items) {
      const onboardData = mapFunction(item);

      // Call the stored procedure (assuming it returns success and message)
      const { rows } = await pool.query('SELECT * FROM onboard_retailer($1)', [onboardData]);
      const { success, message } = rows[0]; // Adjust based on actual stored procedure output

      // Extract agentCode and whatsappNo based on source table
      let agentCode: string;
      let whatsappNo: string;

      if (sourceTable === 'navisionRetailMaster') {
        const retailItem = item as RetailMaster;
        agentCode = retailItem.agentCode ?? 'Unknown';
        whatsappNo = retailItem.whatsappNo ?? '';
      } else if (sourceTable === 'navisionCustomerMaster') {
        const customerItem = item as CustomerMaster;
        agentCode = customerItem.salesAgent ?? 'Unknown';
        whatsappNo = customerItem.whatsappNo1 ?? '';
      } else if (sourceTable === 'navisionNotifyCustomer') {
        const notifyItem = item as NotifyCustomer;
        agentCode = notifyItem.salesAgent ?? 'Unknown';
        whatsappNo = notifyItem.whatsappNo ?? '';
      } else {
        agentCode = 'Unknown';
        whatsappNo = '';
      }

      results.push({
        navisionId: onboardData.navision_id,
        sourceTable,
        success,
        reason: success ? null : message,
        agentCode,
        whatsappNo,
      });
    }

    return results;
  }
//onboardAllRetailers()



mapDist2()
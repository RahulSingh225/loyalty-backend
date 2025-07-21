import { db, pool } from './services/db.service';
import { navisionCustomerMaster, navisionNotifyCustomer, navisionRetailMaster, userMaster } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { PoolClient } from 'pg';


interface OnboardData {
  username: string;
  mobile_number: string;
  secondary_mobile_number: string | null;
  password: string;
  shop_name: string;
  shop_address: string | null;
  home_address: string | null;
  work_address: string | null;
  pan_id: string | null;
  aadhar_id: string | null;
  gst_id: string | null;
  pin_code: string | null;
  city: string | null;
  state: string | null;
  user_type: string;
  navision_id: string;
  fcm_token: string | null;
  device_details: object | null;
}

interface CustomerMaster {
  no: string;
  name: string;
  address: string;
  address2: string | null;
  city: string | null;
  postCode: string | null;
  stateCode: string | null;
  countryRegionCode: string | null;
  whatsappNo1: string | null;
  whatsappNo2: string | null;
  pANNo: string | null;
  gstRegistrationNo: string | null;
  salesAgent: string | null;
  salesAgentName: string | null;
  salespersonCode: string | null;
  etag: string | null;
  createdAt: string;
  onboarded: boolean;
  onboardedAt: string | null;
}

interface NotifyCustomer {
  no: string | null;
  name: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  postCode: string | null;
  stateCode: string | null;
  countryRegionCode: string | null;
  whatsappNo: string | null;
  whatsappNo2: string | null;
  salesAgent: string | null;
  salesAgentName: string | null;
  salesPerson: string | null;
  agentCodeVisibility: boolean | null;
  pANNo: string | null;
  gstRegistrationNo: string | null;
  etag: string | null;
}

interface RetailMaster {
  no: string;
  address2: string | null;
  city: string | null;
  countryRegionCode: string | null;
  whatsappNo: string | null;
  pANNo: string | null;
  gstRegistrationNo: string | null;
  beatName: string | null;
  gujarat: boolean | null;
  etag: string | null;
  createdAt: string;
  onboarded: boolean;
  onboardedAt: string | null;
  shopName: string | null;
  shopAddress: string | null;
  pinCode: string | null;
  state: string | null;
  whatsappNo2: string | null;
  agentName: string | null;
  supplyFrom: string | null;
  aadhaarNo: string | null;
  salesPersonCode: string | null;
  salesPersonName: string | null;
  agentCode: string | null;
}

interface LogEntry {
  rawOutput:any;
  mobileParam:string;
  navisionId: string;
  sourceTable: string;
  success: boolean;
  reason: string | null;
  agentCode: string;
  whatsappNo: string;
}

interface OnboardResult {
  success: boolean;
  user_id?: number;
  retailer_id?: number;
  error?: string;
  message?:string;
}

// Hash password once (do this securely in production)
const password = 'default@123';
let hashedPassword: string;

(async () => {
  hashedPassword = await bcrypt.hash(password, 10);
})();

// Batch size for concurrent processing
const BATCH_SIZE = 50;

// Validate OnboardData before calling the procedure
function validateOnboardData(data: OnboardData): boolean {
  if (!data.username || !data.mobile_number || !data.shop_name || !data.user_type || !data.password) {
    console.error(`Validation failed: Missing required fields for ${data.navision_id || 'unknown'}`);
    return false;
  }
  return true;
}

// Generic function to call onboard_retailer procedure
async function callProcedure(client: PoolClient, data: OnboardData): Promise<OnboardResult> {
  if (!validateOnboardData(data)) {
    return { success: false, error: `Invalid data for navision_id ${data.navision_id || 'unknown'}` };
  }
  try {
    // Log parameters for debugging
    console.log('Calling onboard_retailer with:', {
      username: data.username,
      mobile_number: data.mobile_number,
      secondary_mobile_number: data.secondary_mobile_number,
      shop_name: data.shop_name,
      user_type: data.user_type,
      navision_id: data.navision_id,
    });

        const deviceDetailsJson = data.device_details ? JSON.stringify(data.device_details) : null;


    const result = await client.query<{ result: OnboardResult }>(
      `SELECT onboard_retailer($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) AS result`,
      [
        data.username,
        data.mobile_number,
        data.secondary_mobile_number,
        data.password,
        data.shop_name,
        data.shop_address,
        data.pan_id,
        data.aadhar_id,
        data.gst_id,
        data.pin_code,
        data.city,
        data.state,
        data.user_type,
        'test',
        data.navision_id,
        deviceDetailsJson
      ]
    );
    const onboardResult = result.rows[0]?.result;
    if (onboardResult.success) {
      console.log(`Successfully onboarded: ${data.navision_id} (user_id: ${onboardResult.user_id}, retailer_id: ${onboardResult.retailer_id})`);
    } else {
      console.error(`Failed to onboard ${data.navision_id}: ${onboardResult.message}`);
    }
    return onboardResult;
  } catch (err: any) {
    const errorMessage = `Failed to onboard ${data.navision_id}: ${err.message}`;
    console.error(errorMessage);
   //fs.appendFileSync('onboardAllRetailers_log.txt', `${new Date().toISOString()}: ${errorMessage}\n`);
    return { success: false, error: errorMessage };
  }
}

// Process records in batches and return LogEntry array
async function processBatch<T>(
  records: T[],
  mapToOnboardData: (record: T) => OnboardData,
  tableName: string
): Promise<LogEntry[]> {
  const client = await pool.connect();
  const results: LogEntry[] = [];
  try {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchData = batch.map(mapToOnboardData);
      const batchPromises = batchData.map(async (data) => {
        // Extract agentCode and whatsappNo based on source table
        let agentCode: string;
        let whatsappNo: string;

        if (tableName === 'navisionRetailMaster') {
          const retailItem = batch[batchData.indexOf(data)] as RetailMaster;
          agentCode = retailItem.agentCode ?? 'Unknown';
          whatsappNo = retailItem.whatsappNo ?? '';
        } else if (tableName === 'navisionCustomerMaster') {
          const customerItem = batch[batchData.indexOf(data)] as CustomerMaster;
          agentCode = customerItem.salesAgent ?? 'Unknown';
          whatsappNo = customerItem.whatsappNo1 ?? '';
        } else if (tableName === 'navisionNotifyCustomer') {
          const notifyItem = batch[batchData.indexOf(data)] as NotifyCustomer;
          agentCode = notifyItem.salesAgent ?? 'Unknown';
          whatsappNo = notifyItem.whatsappNo ?? '';
        } else {
          agentCode = 'Unknown';
          whatsappNo = '';
        }

        const enttry = await db.select().from(userMaster).where(eq(userMaster.mobileNumber,data.mobile_number))
        if(enttry.length){
          return null
        }

        const result = await callProcedure(client, data);
        return {
          rawOutput:result,
          mobileParam:data.mobile_number,
          navisionId: data.navision_id,
          sourceTable: tableName,
          success: result.success,
          reason: result.message || null,
          agentCode,
          whatsappNo,
        };
      });

      const batchResults = (await Promise.all(batchPromises)).filter(Boolean);
      results.push(...batchResults);
      console.log(`Processed batch ${i / BATCH_SIZE + 1} of ${tableName}`);
    }
  } finally {
    client.release();
  }
  return results;
}

async function onboardAll() {
  try {
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
      const errorMsg = 'Stored procedure onboard_retailer does not exist in the public schema';
      console.error(errorMsg);
      //fs.appendFileSync('onboardAllRetailers_log.txt', `${new Date().toISOString()}: ${errorMsg}\n`);
      throw new Error(errorMsg);
    }

    // Fetch all data concurrently
    const [customers, notifyCustomers, retailCustomers] = await Promise.all([
      db.select().from(navisionCustomerMaster),
      db.select().from(navisionNotifyCustomer),
      db.select().from(navisionRetailMaster),
    ]);

    // Map functions to convert table records to OnboardData
    const mapCustomerMaster = (c: CustomerMaster): OnboardData => ({
      username: c.name,
      mobile_number: c.whatsappNo1 ?? null,
      secondary_mobile_number: c.whatsappNo2?.trim().length?c.whatsappNo2.trim():null,
      password: 'default@123',
      shop_name: c.name,
      shop_address: c.address,
      home_address: c.address2,
      work_address: null,
      pan_id: c.pANNo,
      aadhar_id: null,
      gst_id: c.gstRegistrationNo,
      pin_code: c.postCode,
      city: c.city,
      state: c.stateCode,
      user_type: 'retailer',
      fcm_token: null,
      navision_id: c.no,
      device_details: null,
    });

    const mapNotifyCustomer = (n: NotifyCustomer): OnboardData => ({
      username: n.name ?? '',
      mobile_number: n.whatsappNo ?? '',
      secondary_mobile_number: n.whatsappNo2?.trim().length?n.whatsappNo2.trim():null,
      password: 'default@123',
      shop_name: n.name ?? '',
      shop_address: n.address,
      home_address: n.address2,
      work_address: null,
      pan_id: n.pANNo,
      aadhar_id: null,
      gst_id: n.gstRegistrationNo,
      pin_code: n.postCode,
      city: n.city,
      state: n.stateCode,
      user_type: 'retailer',
      fcm_token: null,
      navision_id: n.no ?? '',
      device_details: null,
    });

    const mapRetailMaster = (r: RetailMaster): OnboardData => ({
      username: r.shopName ?? '',
      mobile_number: r.whatsappNo ?? '',
      secondary_mobile_number: r.whatsappNo2?.trim().length?r.whatsappNo2.trim():null,
      password: 'default@123',
      shop_name: r.shopName ?? '',
      shop_address: r.shopAddress,
      home_address: r.address2,
      work_address: null,
      pan_id: r.pANNo,
      aadhar_id: r.aadhaarNo,
      gst_id: r.gstRegistrationNo,
      pin_code: r.pinCode,
      city: r.city,
      state: r.state,
      user_type: 'retailer',
      fcm_token: null,
      navision_id: r.no,
      device_details: null,
    });

    // Process all tables concurrently with batching
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

//     const logContent = `
// Date: ${new Date().toISOString()}
// Total attempted: ${totalAttempted}
// Successfully onboarded: ${successful}
// Failed to onboard: ${failed.length}
// ${failed.length > 0 ? 'Details of failed onboardings:\n' + failed.map(fail => 
//   `Navision ID: ${fail.navisionId}, Source: ${fail.sourceTable}, Reason: ${fail.reason}, Agent Code: ${fail.agentCode}, WhatsApp No: ${fail.whatsappNo}, Dump: ${JSON.stringify(fail.rawOutput)},PARAMSENT: ${fail.mobileParam}`
// ).join('\n') : ''}
// `;

    // Write to log file
    // fs.writeFileSync('onboardAllRetailers_log.txt', logContent);

    // // Log to console
    // console.log(`Total attempted: ${totalAttempted}`);
    // console.log(`Successfully onboarded: ${successful}`);
    // console.log(`Failed to onboard: ${failed.length}`);
    // if (failed.length > 0) {
    //   console.log('Details of failed onboardings:');
    //   for (const fail of failed) {
    //     console.log(
    //       `Navision ID: ${fail.navisionId}, Source: ${fail.sourceTable}, Reason: ${fail.reason}, Agent Code: ${fail.agentCode}, WhatsApp No: ${fail.whatsappNo}`
    //     );
    //   }
    // }

    console.log('✅ Bulk onboarding complete');
  } catch (err: any) {
    const errorMsg = `❌ Error during onboarding: ${err.message}`;
    console.error(errorMsg);
    //fs.appendFileSync('onboardAllRetailers_log.txt', `${new Date().toISOString()}: ${errorMsg}\n`);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run the onboarding process
onboardAll()
  .then(() => {
    console.log('✅ Onboarding process finished');
    process.exit(0);
  })
  .catch((err: any) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
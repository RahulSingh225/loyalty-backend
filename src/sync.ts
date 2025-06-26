import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv'
import { eq, sql } from 'drizzle-orm';
import {
  salesPointsClaimTransfer,
  salesPointLedgerEntry,
  retailerRewardPointEntry,
  navisionSalespersonList,
  navisionNotifyCustomer,
  navisionCustomerMaster,
  navisionRetailMaster,
} from './db/schema'; // Adjust the import path based on your schema file location
import { db } from './services/db.service';



// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // Timeout after 5 seconds
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
});


pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

//const db = drizzle(pool);

async function checkDatabaseConnection(): Promise<void> {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw new Error(`Failed to connect to database: ${error.message}`);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Insert functions for each table
async function insertSalesPointsClaimTransfer(data) {
  try {
    if (!data['Document_No']) {
  console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(data)}`);
  return;
}
    await db
      .insert(salesPointsClaimTransfer)
      .values({
        documentNo: String(data['Document_No']),
        isMaster: data['Is_Master'],
        lineNo: data['Line_No'],
        entryType: data['Entry_Type'],
        lineType: data['Line_Type'],
        customerNo: data['Customer_No'],
        customerName: data['Customer_Name'],
        agentCode: data['Agent_Code'],
        agentName: data['Agent_Name'],
        retailerNo: data['Retailer_No'],
        retailerName: data['retailer_Name'],
        notifyCustomer: data['Notify_Customer'],
        notifyCustomerName: data['Notify_Customer_Name'],
        salesPersonCode: data['Sales_Person_Code'],
        customerPostingGroup: data['Customer_Posting_Group'],
        status: data['Status'],
        scheme: data['Scheme'],
        salesPoint: data['Sales_Point'],
        quantity: (data['Quantity']),
        qualityDesc: data['Quality_Desc'],
        multiplier: data['Multiplier'],
        etag: data['ETag'],
      })
      .onConflictDoNothing({ target: salesPointsClaimTransfer.lineNo });
    console.log('Inserted into sales_points_claim_transfer');
  } catch (error) {
    console.error('Error inserting into sales_points_claim_transfer:', error);
    throw error;
  }
}

async function insertSalesPointLedgerEntry(data) {
  try {
    if (!data['Document_No']) {
  console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(data)}`);
  return;
}
    await db
      .insert(salesPointLedgerEntry)
      .values({
        entryNo: data['Entry_No'],
    documentType: data['Document_Type'],
    documentNo: data['Document_No'],
    customerNo: data['Customer_No'],
    customerName: data['Customer_Name'],
    notifyCustomerNo: data['Notify_Customer_No'],
    notifyCustomerName: data['Notify_Customer_Name'],
    agentCode: data['Agent_Code'],
    agentName: data['Agent_Name'],
    retailerNo: data['Retailer_No'],
    retailerName: data['Retailer_Name'],
    scheme: data['Scheme'],
    salesPoints: data['Sales_Points'],
    customerIsAgent: data['Customer_is_Agent'],
    etag: data['ETag'],
      })
      .onConflictDoNothing({ target: salesPointLedgerEntry.entryNo });
    console.log('Inserted into sales_point_ledger_entry');
  } catch (error) {
    console.error('Error inserting into sales_point_ledger_entry:', error);
    throw error;
  }
}

async function insertRetailerRewardPointEntry(data) {
  try {
console.log(data)
    if (!data['Document_No']) {
  console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(data)}`);
  return;
}
    await db
    
      .insert(retailerRewardPointEntry)
      .values({
        entryNo: data['Entry_No'],
    entryDate: data['Entry_Date'],
    purchaseFromVendorNo: data['Purchase_from_Vendor_No'],
    status: data['Status'],
    scheme: data['Scheme'],
    agentCode: data['Agent_Code'],
    agentName: data['Agent_Name'],
    partyNo: data['Party_No'],
    partyName: data['Party_Name'],
    documentNo: data['Document_No'],
    whatsappNo: data['WhatsApp_No'],
    whatsappNo2: data['WhatsApp_No_2'],
    courierName: data['Courier_Name'],
    giftArticleName: data['Gift_Article_Name'],
    qty: data['Qty'],
    etag: data['ETag'],
      })
      .onConflictDoNothing({ target: retailerRewardPointEntry.entryNo });
    console.log('Inserted into retailer_reward_point_entry');
  } catch (error) {
    console.error('Error inserting into retailer_reward_point_entry:', error);
    throw error;
  }
}

async function insertNavisionSalespersonList(data) {
  try {
    await db
      .insert(navisionSalespersonList)
      .values({
         code: data['Code'],
    name: data['Name'],
    address: data['Address'],
    address2: data['Address_2'],
    city: data['City'],
    state: data['State'],
    postCode: data['Post_Code'],
    whatsappMobileNumber: data['Whatsapp_Mobile_Number'],
    etag: data['ETag'],
      })
      .onConflictDoNothing({ target: navisionSalespersonList.whatsappMobileNumber });
    console.log('Inserted into navision_salesperson_list');
  } catch (error) {
    console.error('Error inserting into navision_salesperson_list:', error);
    throw error;
  }
}

async function insertNavisionNotifyCustomer(data) {
  try {
    await db
      .insert(navisionNotifyCustomer)
      .values({
       no: data['No'],
    name: data['Name'],
    address: data['Address'],
    address2: data['Address_2'],
    city: data['City'],
    postCode: data['Post_Code'],
    stateCode: data['State_Code'],
    countryRegionCode: data['Country_Region_Code'],
    whatsappNo: data['Whatsapp_No'],
    whatsappNo2: data['Whatsapp_No_2'],
    salesAgent: data['Sales_Agent'],
    salesAgentName: data['Sales_Agent_Name'],
    salesPerson: data['Sales_Person'],
    agentCodeVisibility: data['Agent_Code_Visibility'],
    pANNo: data['P_A_N_No'],
    gstRegistrationNo: data['GST_Registration_No'],
    etag: data['ETag'],
      })
      .onConflictDoNothing({ target: navisionNotifyCustomer.no });
    console.log('Inserted into navision_notify_customer');
  } catch (error) {
    console.error('Error inserting into navision_notify_customer:', error);
    throw error;
  }
}

async function insertNavisionCustomerMaster(data) {
  try {
    await db
      .insert(navisionCustomerMaster)
      .values({
          no: data["No"],
    name: data["Name"],
    address: data["Address"],
    address2: data["Address_2"],
    city: data["City"],
    postCode: data["Post_Code"],
    stateCode: data["State_Code"],
    countryRegionCode: data["Country_Region_Code"],
    whatsappNo1: data["Whatsapp_No_1"],
    whatsappNo2: data["Whatsapp_No_2"],
    pANNo: data["P_A_N_No"],
    gstRegistrationNo: data["GST_Registration_No"],
    salesAgent: data["Sales_Agent"],
    salesAgentName: data["Sales_Agent_Name"],
    salespersonCode: data["Salesperson_Code"],
    etag: data["ETag"],
    createdAt: data.createdAt || sql`CURRENT_TIMESTAMP`,
    onboarded:  false,
    onboardedAt: null
      })
      .onConflictDoNothing({ target: navisionCustomerMaster.no });
    console.log('Inserted into navision_customer_master');
  } catch (error) {
    console.error('Error inserting into navision_customer_master:', error);
    throw error;
  }
}

async function insertNavisionRetailMaster(data) {
  try {
    await db
      .insert(navisionRetailMaster)
      .values({
        no: data["No"],
	address2: data["Address_2"] || "",
	city: data["City"],
	countryRegionCode: data["Country_Region_Code"] || "",
	whatsappNo: data["Whatsapp_No"],
	pANNo: data["P_A_N_No"],
	gstRegistrationNo: data["GST_Registration_No"],
	beatName: data["Beat_Name"],
	gujarat: data["State"]?.toLowerCase() === "gujarat",
	etag: data["ETag"],
	createdAt: data.createdAt || sql`CURRENT_TIMESTAMP`,
	onboarded: data.onboarded ?? false,
	onboardedAt: data.onboardedAt,
	shopName: data["Shop_Name"],
	shopAddress: data["Shop_Address"],
	pinCode: data["Pin_Code"],
	state: data["State"],
	whatsappNo2: data["Whatsapp_No_2"],
	agentName: data["Agent_Name"],
	supplyFrom: data["Supply_From"]?.trim(),
	aadhaarNo: data["Aadhaar_No"],
	salesPersonCode: data["Sales_Person_Code"],
	salesPersonName: data["Sales_Person_Name"],
	agentCode: data["Agent_Code"]

      })
      .onConflictDoNothing({ target: navisionRetailMaster.no });
    console.log('Inserted into navision_retail_master');
  } catch (error) {
    console.error('Error inserting into navision_retail_master:', error);
    throw error;
  }
}

// Example usage with JSON data
async function main() {
  dotenv.config();
  if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set in environment variables");
}
checkDatabaseConnection()
  // Bulk insert SalesPointsClaimTransfer
  // const salesPointsClaimTransferData:[] = require('../json/salesPointsClaimTransfer').default;
  // for (const item of salesPointsClaimTransferData) {
  //   await insertSalesPointsClaimTransfer(item);
  // }

  // Bulk insert SalesPointLedgerEntry
  // const salesPointLedgerEntryData: [] = require('../json/salesPointLedgerEntry').default;
  // for (const item of salesPointLedgerEntryData) {
  //   await insertSalesPointLedgerEntry(item);
  // }

  // Bulk insert RetailerRewardPointEntry
  // const retailerRewardPointEntryData: [] = require('../json/retailerRewardPointEntry').default;
  // for (const item of retailerRewardPointEntryData) {
  //   await insertRetailerRewardPointEntry(item);
  // }

  // // Bulk insert NavisionSalespersonList
  // const navisionSalespersonListData: [] = require('../json/navisionSalespersonList').default;
  // for (const item of navisionSalespersonListData) {
  //   await insertNavisionSalespersonList(item);
  // }

  // // Bulk insert NavisionNotifyCustomer
  // const navisionNotifyCustomerData: [] = require('../json/navisionNotifyCustomer').default;
  // for (const item of navisionNotifyCustomerData) {
  //   await insertNavisionNotifyCustomer(item);
  // }

  // Bulk insert NavisionCustomerMaster
  // const navisionCustomerMasterData: [] = require('../json/navisionCustomerMaster').default;
  // for (const item of navisionCustomerMasterData) {
  //   await insertNavisionCustomerMaster(item);
  // }

  // Bulk insert NavisionRetailMaster
  const navisionRetailMasterData: [] = require('../json/navisionRetailMaster').default;
  for (const item of navisionRetailMasterData) {
    await insertNavisionRetailMaster(item);
  }

  // Close the database pool
  await pool.end();
}


// Run the main function
main().catch((error) => {
 
  console.error('Error in main:', error);
});
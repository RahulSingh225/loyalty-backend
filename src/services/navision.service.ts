import axios from 'axios';
import { navisionCustomerMaster, navisionVendorMaster, navisionRetailMaster, navisionNotifyCustomer, salesPointLedgerEntry, salesPointsClaimTransfer, navisionSalespersonList, retailerRewardPointEntry, retailer, distributor, userMaster, salesperson, apiResponseLogs, onboardingLogs } from '../db/schema';
import { db, pool } from './db.service';
import dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import {  and, eq, inArray, isNotNull, isNull, ne, or, sql, sum } from 'drizzle-orm';
import { PoolClient } from 'pg';
import { GlobalState } from '../configs/config';
    type VendorInsert = typeof navisionVendorMaster.$inferInsert;
    type RetailerInsert = typeof navisionRetailMaster.$inferInsert;
    type CustomerInsert = typeof navisionCustomerMaster.$inferInsert;
    interface MergedPoint {
  id: string; // Adjust type if navision_id is a number
  totalPoints: number;
}
import fs from 'fs'
import { ClaimPostPayload } from '../types';


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






// Interface for onboard_retailer return value
interface OnboardResult {
  success: boolean;
  user_id?: number;
  retailer_id?: number;
  error?: string;
}
interface NavisionMapping {
  no: string;
  agent: string;
  source: 'retail' | 'customer' | 'notify';
}
interface UpdateResult {
  updatedCount: number;
  skippedNavIds: { navId: string; reason: string; source?: string; agent?: string }[];
}
class NavisionService {
  
  constructor() {



    dotenv.config(); // Ensure dotenv is configured to load environment variables


 
  }
   private hasKey(object, key) {
    return object?.[key] !== undefined;
}

  private generateBasicAuth(username: string, password: string): string {
    try {
      // Combine username and password with a colon
      const credentials = `${username}:${password}`;
      // Encode to Base64 (using Buffer for Node.js)
      const base64Credentials = Buffer.from(credentials).toString('base64');
      // Return the Basic Authorization header value
      return `Basic ${base64Credentials}`;
    } catch (error: any) {
      //console.error('Error generating Basic Authorization:', error.message);
      throw error;
    }
  }

  async makeRequest(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH', data: any = null) {
    try {
      const config = {
        method: method.toUpperCase(),
        url: url,
        headers: {
          'Accept': 'application/json',
          'Authorization': this.generateBasicAuth(
            process.env.NAVISION_USERNAME || '',
            process.env.NAVISION_PASSWORD || ''
          ),
        },
        data: null as any,
      };
      

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error(`Error in ${method} request to ${url}:`, error.message);
      throw error;
    }
  }

  async syncVendor() {
    try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/VendorList_LoyaltyApp`, 'GET');
     
      await this.bulkInsertVendors(result.value);
    } catch (error: any) {
      //console.error('Error syncing vendor:', error);
      throw new Error('Failed to sync vendor data with Navision');
    }
  }

  async syncCustomer() {
    try {
      const pageSize = 1000; // Define the number of records to fetch per request
    let skip = 0; // Initial $skip value
        let hasMoreData = true;

        while (hasMoreData) {
            // Construct URL with $top and $skip parameters
            const url = `${process.env.NAVISION_URL}/CustomerList_LoyaltyAppAPI?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            
            // Process batch of customer data
            await this.bulkInsertCustomers(result.value);

            // Check if there are more records to fetch
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize; // Increment skip for the next page
        }


   
  } catch (error: any) {
      console.error('Error syncing customer:', error);
      throw new Error('Failed to sync customer data with Navision');
    }
  }

 async syncRetail() {
    try {
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/RetailList_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertRetailers(result.value);
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
      
      fs.appendFileSync('log.txt',JSON.stringify(error))
        console.error('Error syncing retail:');
        
        throw new Error(error);
    }
}

async syncSalesLedger() {
    try {
        const pageSize = 50000;
        const batchSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/SalesPointsLedgerEntries_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            
            // Process records in batches of 1000
            for (let i = 0; i < result.value.length; i += batchSize) {
                const batch = result.value.slice(i, i + batchSize);
                await this.bulkInsertSalesPointLedgerEntry(batch);
                console.log(`Inserted batch of ${batch.length} records. Total processed: ${skip + i + batch.length}`);
            }

            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
        console.error('Error syncing sales ledger:', error);
        throw new Error('Failed to sync sales ledger data with Navision');
    }
}

async syncNotifyCustomer() {
    try {
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/NotifyCustomerList_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertNavisionNotifyCustomer(result.value);
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
        console.error('Error syncing notify customer:', error);
        throw new Error('Failed to sync notify customer data with Navision');
    }
}

async syncSalesClaimTransfer() {
    try {
        const pageSize = 50000;
        const batchSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/SalesPointClaim_Transfer_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            
            // Process records in batches of 1000
            for (let i = 0; i < result.value.length; i += batchSize) {
                const batch = result.value.slice(i, i + batchSize);
                await this.bulkInsertSalesPointsClaimTransfer(batch);
                console.log(`Inserted batch of ${batch.length} records. Total processed: ${skip + i + batch.length}`);
            }

            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
        console.error('Error syncing sales claim transfer:', error);
        throw new Error('Failed to sync sales claim transfer data with Navision');
    }
}

async syncSalesPersonList() {
    try {
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/SalespersonList_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertNavisionSalespersonList(result.value);
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
        console.error('Error syncing salesperson list:', error);
        throw new Error('Failed to sync salesperson list data with Navision');
    }
}

async syncRetailerReward() {
    try {
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/RetailerRewardPoint_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertRetailerRewardPointEntry(result.value);
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
        }
    } catch (error: any) {
        console.error('Error syncing retailer reward:', error);
        throw new Error('Failed to sync retailer reward data with Navision');
    }
}



async  bulkInsertCustomers(customers) {
  try {
    if (!customers.length) {
      console.log('No customers to insert');
      return [];
    }

    // Log the first customer for debugging
    console.log('Sample customer data:', JSON.stringify(customers[0], null, 2));

    // Transform and validate input data to match schema
    const customersWithSchemaFields = [];
    const validationErrors = [];

    customers.forEach((customer, index) => {
      const transformedCustomer = {
        no: customer.No || customer.no,
        name: customer.Name || customer.name || null,
        address: customer.Address || customer.address || null,
        address2: customer.Address_2 || customer.address2 || null,
        city: customer.City || customer.city || null,
        postCode: customer.Post_Code || customer.postCode || null,
        stateCode: customer.State_Code || customer.stateCode || null,
        countryRegionCode: customer.Country_Region_Code || customer.countryRegionCode || null,
        whatsappNo1: customer.Whatsapp_No_1 || customer.whatsappNo1 || null,
        whatsappNo2: customer.Whatsapp_No_2 || customer.whatsappNo2 || null,
        pANNo: customer.P_A_N_No || customer.pANNo || null,
        gstRegistrationNo: customer.GST_Registration_No || customer.gstRegistrationNo || null,
        salesAgent: customer.Sales_Agent || customer.salesAgent || null,
        salesAgentName: customer.Sales_Agent_Name || customer.salesAgentName || null,
        salespersonCode: customer.Salesperson_Code || customer.salespersonCode || null,
        etag: customer.ETag || customer.etag || null,
        createdAt: customer.CreatedAt || customer.createdAt || sql`CURRENT_TIMESTAMP`,
        onboarded: customer.Onboarded ?? customer.onboarded ?? false,
        onboardedAt: customer.OnboardedAt || customer.onboardedAt || null,
      };

      // Validate required fields and length constraints
      const errors = [];

      if (!transformedCustomer.no) {
        errors.push(`Missing required field 'no' at index ${index}: ${JSON.stringify(customer)}`);
      }
      if (transformedCustomer.no && transformedCustomer.no.length > 20) {
        errors.push(`'no' exceeds 20 characters at index ${index}: ${transformedCustomer.no}`);
      }
      if (transformedCustomer.name && transformedCustomer.name.length > 100) {
        errors.push(`'name' exceeds 100 characters at index ${index}: ${transformedCustomer.name}`);
      }
      if (transformedCustomer.address && transformedCustomer.address.length > 100) {
        errors.push(`'address' exceeds 100 characters at index ${index}: ${transformedCustomer.address}`);
      }
      if (transformedCustomer.address2 && transformedCustomer.address2.length > 100) {
        errors.push(`'address2' exceeds 100 characters at index ${index}: ${transformedCustomer.address2}`);
      }
      if (transformedCustomer.city && transformedCustomer.city.length > 50) {
        errors.push(`'city' exceeds 50 characters at index ${index}: ${transformedCustomer.city}`);
      }
      if (transformedCustomer.postCode && transformedCustomer.postCode.length > 20) {
        errors.push(`'postCode' exceeds 20 characters at index ${index}: ${transformedCustomer.postCode}`);
      }
      if (transformedCustomer.stateCode && transformedCustomer.stateCode.length > 10) {
        errors.push(`'stateCode' exceeds 10 characters at index ${index}: ${transformedCustomer.stateCode}`);
      }
      if (transformedCustomer.countryRegionCode && transformedCustomer.countryRegionCode.length > 10) {
        errors.push(`'countryRegionCode' exceeds 10 characters at index ${index}: ${transformedCustomer.countryRegionCode}`);
      }
      if (transformedCustomer.whatsappNo1 && transformedCustomer.whatsappNo1.length > 15) {
        errors.push(`'whatsappNo1' exceeds 15 characters at index ${index}: ${transformedCustomer.whatsappNo1}`);
      }
      if (transformedCustomer.whatsappNo2 && transformedCustomer.whatsappNo2.length > 15) {
        errors.push(`'whatsappNo2' exceeds 15 characters at index ${index}: ${transformedCustomer.whatsappNo2}`);
      }
      if (transformedCustomer.pANNo && transformedCustomer.pANNo.length > 20) {
        errors.push(`'pANNo' exceeds 20 characters at index ${index}: ${transformedCustomer.pANNo}`);
      }
      if (transformedCustomer.gstRegistrationNo && transformedCustomer.gstRegistrationNo.length > 20) {
        errors.push(`'gstRegistrationNo' exceeds 20 characters at index ${index}: ${transformedCustomer.gstRegistrationNo}`);
      }
      if (transformedCustomer.salesAgent && transformedCustomer.salesAgent.length > 20) {
        errors.push(`'salesAgent' exceeds 20 characters at index ${index}: ${transformedCustomer.salesAgent}`);
      }
      if (transformedCustomer.salesAgentName && transformedCustomer.salesAgentName.length > 100) {
        errors.push(`'salesAgentName' exceeds 100 characters at index ${index}: ${transformedCustomer.salesAgentName}`);
      }
      if (transformedCustomer.salespersonCode && transformedCustomer.salespersonCode.length > 20) {
        errors.push(`'salespersonCode' exceeds 20 characters at index ${index}: ${transformedCustomer.salespersonCode}`);
      }
      if (transformedCustomer.etag && transformedCustomer.etag.length > 100) {
        errors.push(`'etag' exceeds 100 characters at index ${index}: ${transformedCustomer.etag}`);
      }

      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        customersWithSchemaFields.push(transformedCustomer);
      }
    });

    // Log validation errors if any
    if (validationErrors.length > 0) {
      console.warn(`Skipped ${validationErrors.length} validation errors:`);
      validationErrors.forEach(error => console.warn(error));
    }

    // If no valid records, log and return
    if (customersWithSchemaFields.length === 0) {
      console.log('No valid records to insert into navision_customer_master');
      return [];
    }

    // Perform bulk insert with conflict handling
    const result = await db
      .insert(navisionCustomerMaster)
      .values(customersWithSchemaFields)
      .onConflictDoUpdate({ target: navisionCustomerMaster.no,set:{
        name: sql`EXCLUDED."Name"`,
        address: sql`EXCLUDED."Address"`,
        address2: sql`EXCLUDED."Address_2"`,
        city: sql`EXCLUDED."City"`,
        postCode: sql`EXCLUDED."Post_Code"`,
        stateCode: sql`EXCLUDED."State_Code"`,
        countryRegionCode: sql`EXCLUDED."Country_Region_Code"`,
        whatsappNo1: sql`EXCLUDED."Whatsapp_No_1"`,
        whatsappNo2: sql`EXCLUDED."Whatsapp_No_2"`,
        pANNo: sql`EXCLUDED."P_A_N_No"`,
        gstRegistrationNo: sql`EXCLUDED."GST_Registration_No"`,
        salesAgent: sql`EXCLUDED."Sales_Agent"`,
        salesAgentName: sql`EXCLUDED."Sales_Agent_Name"`,
        salespersonCode: sql`EXCLUDED."Salesperson_Code"`,
        etag: sql`EXCLUDED."ETag"`,
      } })
      .returning();

    const insertedCount = result.length;
    const skippedCount = customers.length - insertedCount - validationErrors.length;
    console.log(`Inserted ${insertedCount} customers successfully, skipped ${skippedCount} duplicates, ${validationErrors.length} invalid records`);

    return result;
  } catch (error) {
    fs.appendFileSync('log.txt', JSON.stringify(error));
    // Enhanced error logging
    console.error('Error inserting customers:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      customersSample: customers.slice(0, 2),
      query: error.query || 'N/A',
    });
    throw new Error(`Error inserting customers: ${error.message}`);
  }
}


async  bulkInsertRetailerRewardPointEntry(data) {
  try {
    // Handle both single object and array of objects
    const records = Array.isArray(data) ? data : [data];
    
    // Filter out records with missing Document_No and log them
    const validRecords = records.filter(record => {
      if (!record['Document_No']) {
        console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(record)}`);
        return false;
      }
      return true;
    });

    if (validRecords.length === 0) {
      console.log('No valid records to insert into retailer_reward_point_entry');
      return;
    }

    await db
      .insert(retailerRewardPointEntry)
      .values(validRecords.map(record => ({
        entryNo: record['Entry_No'],
        entryDate: record['Entry_Date'],
        purchaseFromVendorNo: record['Purchase_from_Vendor_No'],
        status: record['Status'],
        scheme: record['Scheme'],
        agentCode: record['Agent_Code'],
        agentName: record['Agent_Name'],
        partyNo: record['Party_No'],
        partyName: record['Party_Name'],
        documentNo: record['Document_No'],
        whatsappNo: record['WhatsApp_No'],
        whatsappNo2: record['WhatsApp_No_2'],
        courierName: record['Courier_Name'],
        giftArticleName: record['Gift_Article_Name'],
        qty: record['Qty'],
        etag: record['ETag'],
      })))
      .onConflictDoNothing({ target: retailerRewardPointEntry.entryNo });

    console.log(`Inserted ${validRecords.length} records into retailer_reward_point_entry`);
  } catch (error) {
    console.error('Error inserting into retailer_reward_point_entry:', error);
    throw error;
  }
}

async  bulkInsertVendors(vendors: any[]) {
  try {
    if (!vendors.length) {
      console.log('No vendors to insert');
      return [];
    }

    // Log the first vendor for debugging
    console.log('Sample vendor data:', JSON.stringify(vendors[0], null, 2));

    // Transform input data to match schema field names
    const vendorsWithSchemaFields = vendors.map((vendor, index) => {
      const transformedVendor: VendorInsert = {
        no: vendor.No || vendor.no, // Handle both 'No' and 'no'
        name: vendor.Name || vendor.name || null,
        address: vendor.Address || vendor.address || null,
        address2: vendor.Address_2 || vendor.address2 || null,
        city: vendor.City || vendor.city || null,
        postCode: vendor.Post_Code || vendor.postCode || null,
        stateCode: vendor.State_Code || vendor.stateCode || null,
        countryRegionCode: vendor.Country_Region_Code || vendor.countryRegionCode || null,
        whatsappNo: vendor.Whatsapp_No || vendor.whatsappNo || null,
        whatsappMobileNumber: vendor.Whatsapp_Mobile_Number || vendor.whatsappMobileNumber || null,
        pANNo: vendor.P_A_N_No || vendor.pANNo || null,
        gstRegistrationNo: vendor.GST_Registration_No || vendor.gstRegistrationNo || null,
        beatName: vendor.Beat_Name || vendor.beatName || null,
        salesAgentCustomer: vendor.Sales_Agent_Customer || vendor.salesAgentCustomer || null,
        pointClaimCustomerType: vendor.Point_Claim_Customer_Type || vendor.pointClaimCustomerType || null,
        ogs: vendor.OGS ?? vendor.ogs ?? false,
        gujarat: vendor.Gujarat ?? vendor.gujarat ?? false,
        etag: vendor.ETag || vendor.etag || null,
        createdAt: vendor.CreatedAt || vendor.createdAt || sql`CURRENT_TIMESTAMP`, // Use database default
        onboarded: vendor.Onboarded ?? vendor.onboarded ?? false, // Use schema default
        onboardedAt: vendor.OnboardedAt || vendor.onboardedAt || null,
      };

      // Validate required fields
      if (!transformedVendor.no) {
        throw new Error(
          `Invalid vendor data: Missing required field 'no' at index ${index}: ${JSON.stringify(vendor)}`
        );
      }

      return transformedVendor;
    });

    // Perform bulk insert with conflict handling
    const result = await db
      .insert(navisionVendorMaster)
      .values(vendorsWithSchemaFields)
      .onConflictDoUpdate({ target: navisionVendorMaster.no , set: {
          name: sql`EXCLUDED."Name"`,
          address: sql`EXCLUDED."Address"`,
          address2: sql`EXCLUDED."Address_2"`,
          city: sql`EXCLUDED."City"`,
          postCode: sql`EXCLUDED."Post_Code"`,
          stateCode: sql`EXCLUDED."State_Code"`,
          countryRegionCode: sql`EXCLUDED."Country_Region_Code"`,
          whatsappNo: sql`EXCLUDED."Whatsapp_No"`,
          whatsappMobileNumber: sql`EXCLUDED."Whatsapp_Mobile_Number"`,
          pANNo: sql`EXCLUDED."P_A_N_No"`,
          gstRegistrationNo: sql`EXCLUDED."GST_Registration_No"`,
          beatName: sql`EXCLUDED."Beat_Name"`,
          salesAgentCustomer: sql`EXCLUDED."Sales_Agent_Customer"`,
          pointClaimCustomerType: sql`EXCLUDED."Point_Claim_Customer_Type"`,
          ogs: sql`EXCLUDED."OGS"`,
          gujarat: sql`EXCLUDED."Gujarat"`,
          etag: sql`EXCLUDED."ETag"`,
     
        },}) // Skip duplicates based on primary key
      .returning();

    console.log(`Inserted ${result.length} vendors successfully`);
    return result;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error inserting vendors:', {
      message: error.message,
      code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
      detail: error.detail, // Detailed error message from PostgreSQL
      stack: error.stack,
      vendorsSample: vendors.slice(0, 2), // Log first two records
      query: error.query || 'N/A', // Log the failed query if available
    });
    throw new Error(`Error inserting vendors: ${error.message}`);
  }
}

  async  bulkInsertRetailers(retailers: any[]) {
 try {
    if (!retailers.length) {
      console.log('No retailers to insert');
      return [];
    }

    // Log the first retailer for debugging
    //console.log('Sample retailer data:', JSON.stringify(retailers[0], null, 2));

    // Transform and validate input data to match schema
    const retailersWithSchemaFields = [];
    const validationErrors = [];

    retailers.forEach((retailer, index) => {
      const transformedRetailer = {
        no: retailer.No || retailer.no,
        address2: retailer.Address_2 || retailer.address2 || null,
        city: retailer.City || retailer.city || null,
        pinCode: retailer.Post_Code || retailer.postCode || null,
        state: retailer.State || null,
        countryRegionCode: retailer.Country_Region_Code || retailer.countryRegionCode || null,
        whatsappNo: retailer.Whatsapp_No || retailer.whatsappNo || null,
        whatsappNo2: retailer.Whatsapp_No_2 || retailer.whatsappMobileNumber || null,
        pANNo: retailer.P_A_N_No || retailer.pANNo || null,
        gstRegistrationNo: retailer.GST_Registration_No || retailer.gstRegistrationNo || null,
        beatName: retailer.Beat_Name || retailer.beatName || null,
        shopName: retailer.Shop_Name || null,
        shopAddress: retailer.Shop_Address || null,
        agentCode: retailer.Agent_Code || null,
        aadhaarNo: retailer.Aadhaar_No || null,
        supplyFrom: retailer.Supply_From,
        agentName: retailer.Agent_Name || null,
        salesPersonCode: retailer.Sales_Person_Code,
        salesPersonName: retailer.Sales_Person_Name,
        gujarat: retailer.Gujarat ?? retailer.gujarat ?? false,
        etag: retailer.ETag || retailer.etag || null,
        createdAt: retailer.CreatedAt || retailer.createdAt || sql`CURRENT_TIMESTAMP`,
        onboarded: retailer.Onboarded ?? retailer.onboarded ?? false,
        onboardedAt: retailer.OnboardedAt || retailer.onboardedAt || null,
      };

      // Validate required fields and length constraints
      const errors = [];

      if (!transformedRetailer.no) {
        errors.push(`Missing required field 'no' at index ${index}: ${JSON.stringify(retailer)}`);
      }
      if (transformedRetailer.no && transformedRetailer.no.length > 20) {
        errors.push(`Field 'no' exceeds 20 characters at index ${index}: ${transformedRetailer.no}`);
      }
      if (transformedRetailer.address2 && transformedRetailer.address2.length > 100) {
        errors.push(`Field 'address2' exceeds 100 characters at index ${index}: ${transformedRetailer.address2}`);
      }
      if (transformedRetailer.city && transformedRetailer.city.length > 50) {
        errors.push(`Field 'city' exceeds 50 characters at index ${index}: ${transformedRetailer.city}`);
      }
      if (transformedRetailer.pinCode && transformedRetailer.pinCode.length > 20) {
        errors.push(`Field 'pinCode' exceeds 20 characters at index ${index}: ${transformedRetailer.pinCode}`);
      }
      if (transformedRetailer.state && transformedRetailer.state.length > 50) {
        errors.push(`Field 'state' exceeds 50 characters at index ${index}: ${transformedRetailer.state}`);
      }
      if (transformedRetailer.countryRegionCode && transformedRetailer.countryRegionCode.length > 10) {
        errors.push(`Field 'countryRegionCode' exceeds 10 characters at index ${index}: ${transformedRetailer.countryRegionCode}`);
      }
      if (transformedRetailer.whatsappNo && transformedRetailer.whatsappNo.length > 15) {
        errors.push(`Field 'whatsappNo' exceeds 15 characters at index ${index}: ${transformedRetailer.whatsappNo}`);
      }
      if (transformedRetailer.whatsappNo2 && transformedRetailer.whatsappNo2.length > 15) {
        errors.push(`Field 'whatsappNo2' exceeds 15 characters at index ${index}: ${transformedRetailer.whatsappNo2}`);
      }
      if (transformedRetailer.pANNo && transformedRetailer.pANNo.length > 20) {
        errors.push(`Field 'pANNo' exceeds 20 characters at index ${index}: ${transformedRetailer.pANNo}`);
      }
      if (transformedRetailer.gstRegistrationNo && transformedRetailer.gstRegistrationNo.length > 20) {
        errors.push(`Field 'gstRegistrationNo' exceeds 20 characters at index ${index}: ${transformedRetailer.gstRegistrationNo}`);
      }
      if (transformedRetailer.beatName && transformedRetailer.beatName.length > 50) {
        errors.push(`Field 'beatName' exceeds 50 characters at index ${index}: ${transformedRetailer.beatName}`);
      }
      if (transformedRetailer.shopName && transformedRetailer.shopName.length > 100) {
        errors.push(`Field 'shopName' exceeds 100 characters at index ${index}: ${transformedRetailer.shopName}`);
      }
      if (transformedRetailer.shopAddress && transformedRetailer.shopAddress.length > 100) {
        errors.push(`Field 'shopAddress' exceeds 100 characters at index ${index}: ${transformedRetailer.shopAddress}`);
      }
      if (transformedRetailer.agentCode && transformedRetailer.agentCode.length > 20) {
        errors.push(`Field 'agentCode' exceeds 20 characters at index ${index}: ${transformedRetailer.agentCode}`);
      }
      if (transformedRetailer.aadhaarNo && transformedRetailer.aadhaarNo.length > 20) {
        errors.push(`Field 'aadhaarNo' exceeds 20 characters at index ${index}: ${transformedRetailer.aadhaarNo}`);
      }
      if (transformedRetailer.supplyFrom && transformedRetailer.supplyFrom.length > 50) {
        errors.push(`Field 'supplyFrom' exceeds 50 characters at index ${index}: ${transformedRetailer.supplyFrom}`);
      }
      if (transformedRetailer.agentName && transformedRetailer.agentName.length > 100) {
        errors.push(`Field 'agentName' exceeds 100 characters at index ${index}: ${transformedRetailer.agentName}`);
      }
      if (transformedRetailer.salesPersonCode && transformedRetailer.salesPersonCode.length > 20) {
        errors.push(`Field 'salesPersonCode' exceeds 20 characters at index ${index}: ${transformedRetailer.salesPersonCode}`);
      }
      if (transformedRetailer.salesPersonName && transformedRetailer.salesPersonName.length > 100) {
        errors.push(`Field 'salesPersonName' exceeds 100 characters at index ${index}: ${transformedRetailer.salesPersonName}`);
      }
      if (transformedRetailer.etag && transformedRetailer.etag.length > 100) {
        errors.push(`Field 'etag' exceeds 100 characters at index ${index}: ${transformedRetailer.etag}`);
      }

      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        retailersWithSchemaFields.push(transformedRetailer);
      }
    });

    // Log validation errors if any
    if (validationErrors.length > 0) {
      console.warn(`Skipped ${validationErrors.length} validation errors:`);
      validationErrors.forEach(error => console.warn(error));
    }

    // If no valid records, log and return
    if (retailersWithSchemaFields.length === 0) {
      console.log('No valid records to insert into navision_retail_master');
      return [];
    }

    // Perform bulk insert with conflict handling
    const result = await db
      .insert(navisionRetailMaster)
      .values(retailersWithSchemaFields)
      .onConflictDoUpdate({ target: navisionRetailMaster.no ,  set: {
          address2: sql`EXCLUDED."Address_2"`,
          city: sql`EXCLUDED."City"`,
          pinCode: sql`EXCLUDED."Pin_Code"`,
          state: sql`EXCLUDED."State"`,
          countryRegionCode: sql`EXCLUDED."Country_Region_Code"`,
          whatsappNo: sql`EXCLUDED."Whatsapp_No"`,
          whatsappNo2: sql`EXCLUDED."Whatsapp_No_2"`,
          pANNo: sql`EXCLUDED."P_A_N_No"`,
          gstRegistrationNo: sql`EXCLUDED."GST_Registration_No"`,
          beatName: sql`EXCLUDED."Beat_Name"`,
          shopName: sql`EXCLUDED."Shop_Name"`,
          shopAddress: sql`EXCLUDED."Shop_Address"`,
          agentCode: sql`EXCLUDED."Agent_Code"`,
          aadhaarNo: sql`EXCLUDED."Aadhaar_No"`,
          supplyFrom: sql`EXCLUDED."Supply_From"`,
          agentName: sql`EXCLUDED."Agent_Name"`,
          salesPersonCode: sql`EXCLUDED."Sales_Person_Code"`,
          salesPersonName: sql`EXCLUDED."Sales_Person_Name"`,
          gujarat: sql`EXCLUDED."Gujarat"`,
          etag: sql`EXCLUDED."ETag"`,
        },}).returning() // Skip duplicates based on primary key

    const insertedCount = result.length;
    const skippedCount = retailers.length - insertedCount - validationErrors.length;
    console.log(`Inserted ${insertedCount} retailers successfully, skipped ${skippedCount} duplicates, ${validationErrors.length} invalid records`);

    return result;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error inserting retailers:', {
      //message: error.message,
      //code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
      //detail: error.detail, // Detailed error message from PostgreSQL
      //stack: error.stack,
      //retailersSample: retailers.slice(0, 2), // Log first two records for inspection
      //query: error.query || 'N/A', // Log the failed query if available
    });
    throw new Error(`Error inserting retailers:`);
  }
}


async  bulkInsertNavisionNotifyCustomer(dataArray) {
  try {
    // Ensure dataArray is an array and not empty
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('No data provided for bulk insert into navision_notify_customer');
      return;
    }

    // Map the array of data objects to the format required for the insert
    const values = dataArray.map(data => ({
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
    }));

    // Perform bulk insert
    await db
      .insert(navisionNotifyCustomer)
      .values(values)
      .onConflictDoUpdate({ target: navisionNotifyCustomer.no,set: {
          name: sql`EXCLUDED.name`,
          address: sql`EXCLUDED.address`,
          address2: sql`EXCLUDED.address_2`,
          city: sql`EXCLUDED.city`,
          postCode: sql`EXCLUDED.post_code`,
          stateCode: sql`EXCLUDED.state_code`,
          countryRegionCode: sql`EXCLUDED.country_region_code`,
          whatsappNo: sql`EXCLUDED.whatsapp_no`,
          whatsappNo2: sql`EXCLUDED.whatsapp_no_2`,
          salesAgent: sql`EXCLUDED.sales_agent`,
          salesAgentName: sql`EXCLUDED.sales_agent_name`,
          salesPerson: sql`EXCLUDED.sales_person`,
          agentCodeVisibility: sql`EXCLUDED.agent_code_visibility`,
          pANNo: sql`EXCLUDED.p_a_n_no`,
          gstRegistrationNo: sql`EXCLUDED.gst_registration_no`,
          etag: sql`EXCLUDED.etag`,
        }});

    console.log(`Inserted ${dataArray.length} records into navision_notify_customer`);
  } catch (error) {
    console.error('Error during bulk insert into navision_notify_customer:', error);
    throw error;
  }
}

async  bulkInsertSalesPointLedgerEntry(dataArray) {
  try {
    // Ensure dataArray is an array and not empty
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('No data provided for bulk insert into sales_point_ledger_entry');
      return;
    }

    // Filter out records with missing Document_No and map valid records
    const validRecords = [];
    const skippedRecords = [];

    dataArray.forEach(data => {
      if (!data['Document_No']) {
        skippedRecords.push(data);
        console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(data)}`);
      } else {
        validRecords.push({
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
          quantity: data['Quantity'],
          itemGroup: data['Item_Group_Code'],
          createdAt:data['Created_DateTime'] || sql`CURRENT_TIMESTAMP`,
          etag: data['ETag'],
        });
      }
    });

    // If no valid records, log and return
    if (validRecords.length === 0) {
      console.log('No valid records to insert into sales_point_ledger_entry');
      return;
    }

    // Perform bulk insert for valid records
    await db
      .insert(salesPointLedgerEntry)
      .values(validRecords)
      .onConflictDoUpdate({ target: salesPointLedgerEntry.entryNo,set:{

         documentType: sql`EXCLUDED.Document_Type`,
          documentNo: sql`EXCLUDED.Document_No`,
          customerNo: sql`EXCLUDED.Customer_No`,
          customerName: sql`EXCLUDED.Customer_Name`,
          notifyCustomerNo: sql`EXCLUDED.Notify_Customer_No`,
          notifyCustomerName: sql`EXCLUDED.Notify_Customer_Name`,
          agentCode: sql`EXCLUDED.Agent_Code`,
          agentName: sql`EXCLUDED.Agent_Name`,
          retailerNo: sql`EXCLUDED.Retailer_No`,
          retailerName: sql`EXCLUDED.Retailer_Name`,
          scheme: sql`EXCLUDED.Scheme`,
          salesPoints: sql`EXCLUDED.Sales_Points`,
          customerIsAgent: sql`EXCLUDED.Customer_is_Agent`,
          quantity: sql`EXCLUDED.Quantity`,
          itemGroup: sql`EXCLUDED.Item_Group_Code`,
          createdAt:sql`EXCLUDED.Created_DateTime` || sql`CURRENT_TIMESTAMP`,
          etag: sql`EXCLUDED.ETag`,
      } });

    console.log(`Inserted ${validRecords.length} records into sales_point_ledger_entry`);
    if (skippedRecords.length > 0) {
      console.log(`Skipped ${skippedRecords.length} records due to missing documentNo`);
    }
  } catch (error) {
    console.error('Error during bulk insert into sales_point_ledger_entry:', error);
    throw error;
  }
}

rootFiltercheck(uniqueId) {
        const filter = ['JP',
            'AP',
            'CP',
            'JV',
            'MC',
            'NJ',
            'UP',
            'AG0002',
            'AG0003',
            'AG0005',
            'AG0006',
            'AG0007',
            'AG0008',
            'AG0009',
            'AG0011',
            'AG0012',
            'AG0103',
            'AG0014',
            'AG0112',
            'AG0108',
            'AG0022',
            'AG0024',
            'AG0025',
            'AG0033',
            'AG0034',
            'AG0037',
            'AG0038',
            'AG0040',
            'AG0061',
            'AG0048',
            'AG0051',
            'AG0137',
            'AG0056',
            'AG0104',
            'AG0101',
            'AG0055',
            'AG0057',
            'AG0058',
            'AG0132',
            'AG0060',
            'AG0119',
            'AG0110',
            'AG0133',
            'AG0065',
            'AG0067',
            'AG0068',
            'AG0071',
            'AG0124',
            'AG0111',
            'AG0134',
            'AG0141',
            'AG0075',
            'AG0076',
            'AG0131',
            'AG0079',
            'AG0080',
            'AG0140',
            'AG0081',
            'AG0082',
            'AG0083',
            'AG0107',
            'NO-31980',
            'NO-31977',
            'NO-31976',
            'NO-31944',
            'NO-31938',
            'NO-31937',
            'NO-31936',
            'NO-31935',
            'NO-31934',
            'NO-31933',
            'NO-31932',
            'NO-31931',
            'NO-31930',
            'NO-31929',
            'NO-31927',
            'NO-31926',
            'NO-31923',
            'NO-31922',
            'NO-31921',
            'NO-31909',
            'NO-31882',
            'NO-31881',
            'NO-31880',
            'NO-31879',
            'NO-31876',
            'NO-31875',
            'NO-31874',
            'NO-31873',
            'NO-31872',
            'NO-31871',
            'NO-31870',
            'NO-31869',
            'NO-31868',
            'NO-31867',
            'NO-31866',
            'NO-31863',
            'NO-31862',
            'NO-31861',
            'NO-31860',
            'NO-31859',
            'NO-31856',
            'NO-31855',
            'NO-31854',
            'NO-31853',
            'NO-31851',
            'NO-31849',
            'NO-31841',
            'NO-31837',
            'NO-31835',
            'NO-31833',
            'NO-31826',
            'NO-31814',
            'NO-31802',
            'NO-31798',
            'NO-31793',
            'NO-31792',
            'NO-31791',
            'NO-31790',
            'NO-31789',
            'NO-31786',
            'NO-31785',
            'NO-31783',
            'NO-31781',
            'NO-31780',
            'NO-31769',
            'NO-31768',
            'NO-31767',
            'NO-31766',
            'NO-31765',
            'NO-31764',
            'NO-31760',
            'NO-31752',
            'NO-31751',
            'NO-31736',
            'NO-31733',
            'NO-31732',
            'NO-31715',
            'NO-31640',
            'NO-31639',
            'NO-31638',
            'NO-31637',
            'NO-31636',
            'NO-31627',
            'NO-31622',
            'NO-31610',
            'NO-31606',
            'NO-31605',
            'NO-31594',
            'NO-31593',
            'NO-31592',
            'NO-31578',
            'NO-31577',
            'NO-31571',
            'NO-31566',
            'NO-31564',
            'NO-31562',
            'NO-31561',
            'NO-31552',
            'NO-31545',
            'NO-31542',
            'NO-31535',
            'NO-31534',
            'NO-31533',
            'NO-31532',
            'NO-31517',
            'NO-31516',
            'NO-31515',
            'NO-31514',
            'NO-31513',
            'NO-31512',
            'NO-31511',
            'NO-31510',
            'NO-31509',
            'NO-31507',
            'NO-31506',
            'NO-31505',
            'NO-31494',
            'NO-31493',
            'NO-31464',
            'NO-31463',
            'NO-31447',
            'NO-31446',
            'NO-31445',
            'NO-31404',
            'NO-31403',
            'NO-31402',
            'NO-31401',
            'NO-31400',
            'NO-31399',
            'NO-31398',
            'NO-31397',
            'NO-31396',
            'NO-31395',
            'NO-31394',
            'NO-31393',
            'NO-31392',
            'NO-31391',
            'NO-31390',
            'NO-31389',
            'NO-31388',
            'NO-31387',
            'NO-31386',
            'NO-31385',
            'NO-31384',
            'NO-31382',
            'NO-31381',
            'NO-31380',
            'NO-31379',
            'NO-31378',
            'NO-31377',
            'NO-31376',
            'NO-31375',
            'NO-31374',
            'NO-31373',
            'NO-31372',
            'NO-31371',
            'NO-31369',
            'NO-31368',
            'NO-31367',
            'NO-31366',
            'NO-31364',
            'NO-31363',
            'NO-31362',
            'NO-31360',
            'NO-31359',
            'NO-31358',
            'NO-31357',
            'NO-31356',
            'NO-31355',
            'NO-31354',
            'NO-31352',
            'NO-31350',
            'NO-31347',
            'NO-31346',
            'NO-31345',
            'NO-31344',
            'NO-31343',
            'NO-31342',
            'NO-31341',
            'NO-31340',
            'NO-31338',
            'NO-31337',
            'NO-31336',
            'NO-31335',
            'NO-31334',
            'NO-31333',
            'NO-31331',
            'NO-31330',
            'NO-31329',
            'NO-31328',
            'NO-31327',
            'NO-31326',
            'NO-31325',
            'NO-31323',
            'NO-31322',
            'NO-31321',
            'NO-31319',
            'NO-31318',
            'NO-31316',
            'NO-31313',
            'NO-31310',
            'NO-31309',
            'NO-31307',
            'NO-31305',
            'NO-31304',
            'NO-31303',
            'NO-31302',
            'NO-31300',
            'NO-31297',
            'NO-31295',
            'NO-31197',
            'NO-31195',
            'NO-31194',
            'NO-31192',
            'NO-31180',
            'NO-31176',
            'NO-31168',
            'NO-31167',
            'NO-31162',
            'NO-31161',
            'NO-31134',
            'NO-31133',
            'NO-31132',
            'NO-31131',
            'NO-31130',
            'NO-31118',
            'NO-31116',
            'NO-31115',
            'NO-31114',
            'NO-31113',
            'NO-31106',
            'NO-31100',
            'NO-31091',
            'NO-31090',
            'NO-31089',
            'NO-31078',
            'NO-31077',
            'NO-31076',
            'NO-31075',
            'NO-31074',
            'NO-31051',
            'NO-31050',
            'NO-31047',
            'NO-31045',
            'NO-31036',
            'NO-31035',
            'NO-31021',
            'NO-31016',
            'NO-31009',
            'NO-30987',
            'NO-30986',
            'NO-30985',
            'NO-30984',
            'NO-30975',
            'NO-30974',
            'NO-30973',
            'NO-30957',
            'NO-30955',
            'NO-30954',
            'NO-30953',
            'NO-30952',
            'NO-30951',
            'NO-30908',
            'NO-30890',
            'NO-30881',
            'NO-30880',
            'NO-30869',
            'NO-30867',
            'NO-30866',
            'NO-30861',
            'NO-30849',
            'NO-30845',
            'NO-30830',
            'NO-30829',
            'NO-30827',
            'NO-30822',
            'NO-30816',
            'NO-30781',
            'NO-30778',
            'NO-30777',
            'NO-30776',
            'NO-30775',
            'NO-30773',
            'NO-30772',
            'NO-30758',
            'NO-30752',
            'NO-30751',
            'NO-30750',
            'NO-30749',
            'NO-30748',
            'NO-30733',
            'NO-30732',
            'NO-30731',
            'NO-30718',
            'NO-30717',
            'NO-30716',
            'NO-30715',
            'NO-30714',
            'NO-30712',
            'NO-30699',
            'NO-30662',
            'NO-30643',
            'NO-30642',
            'NO-30641',
            'NO-30614',
            'NO-30596',
            'NO-30595',
            'NO-30587',
            'NO-30586',
            'NO-30585',
            'NO-30584',
            'NO-30583',
            'NO-30578',
            'NO-30577',
            'NO-30575',
            'NO-30574',
            'NO-30573',
            'NO-30572',
            'NO-30564',
            'NO-30562',
            'NO-30560',
            'NO-30559',
            'NO-30555',
            'NO-30554',
            'NO-30553',
            'NO-30551',
            'NO-30550',
            'NO-30544',
            'NO-30543',
            'NO-30540',
            'NO-30539',
            'NO-30538',
            'NO-30532',
            'NO-30517',
            'NO-30511',
            'NO-30507',
            'NO-30505',
            'NO-30503',
            'NO-30502',
            'NO-30495',
            'NO-30494',
            'NO-30482',
            'NO-30481',
            'NO-30479',
            'NO-30471',
            'NO-30470',
            'NO-30469',
            'NO-30468',
            'NO-30467',
            'NO-30456',
            'NO-30455',
            'NO-30454',
            'NO-30448',
            'NO-30446',
            'NO-30445',
            'NO-30444',
            'NO-30443',
            'NO-30423',
            'NO-30419',
            'NO-30418',
            'NO-30416',
            'NO-30415',
            'NO-30414',
            'NO-30409',
            'NO-30340',
            'NO-30339',
            'NO-30331',
            'NO-30330',
            'NO-30329',
            'NO-30328',
            'NO-30327',
            'NO-30326',
            'NO-30325',
            'NO-30324',
            'NO-30323',
            'NO-30322',
            'NO-30321',
            'NO-30320',
            'NO-30319',
            'NO-30318',
            'NO-30317',
            'NO-30315',
            'NO-30314',
            'NO-30313',
            'NO-30312',
            'NO-30311',
            'NO-30310',
            'NO-30309',
            'NO-30308',
            'NO-30307',
            'NO-30306',
            'NO-30305',
            'NO-30303',
            'NO-30302',
            'NO-30301',
            'NO-30300',
            'NO-30299',
            'NO-30298',
            'NO-30292',
            'NO-30283',
            'NO-30266',
            'NO-30263',
            'NO-30224',
            'NO-30103',
            'NO-30078',
            'NO-30077',
            'NO-30039',
            'NO-30027',
            'NO-29985',
            'NO-29979',
            'NO-29978',
            'NO-29970',
            'NO-29961',
            'NO-29948',
            'NO-29940',
            'NO-29882',
            'NO-29857',
            'NO-29853',
            'NO-29752',
            'NO-29536',
            'NO-29526',
            'NO-29525',
            'NO-29524',
            'NO-29522',
            'NO-29318',
            'NO-29305',
            'NO-29304',
            'NO-29303',
            'NO-29302',
            'NO-29301',
            'NO-29300',
            'NO-29297',
            'NO-29296',
            'NO-29293',
            'NO-29292',
            'NO-29291',
            'NO-29290',
            'NO-29289',
            'NO-29288',
            'NO-29265',
            'NO-29245',
            'NO-29243',
            'NO-29242',
            'NO-29227',
            'NO-29224',
            'NO-29223',
            'NO-29221',
            'NO-29216',
            'NO-29212',
            'NO-29211',
            'NO-29209',
            'NO-29197',
            'NO-29196',
            'NO-29195',
            'NO-29193',
            'NO-29192',
            'NO-29191',
            'NO-29190',
            'NO-29188',
            'NO-29187',
            'NO-29186',
            'NO-29185',
            'NO-29184',
            'NO-29183',
            'NO-29182',
            'NO-29181',
            'NO-29180',
            'NO-29179',
            'NO-29178',
            'NO-29177',
            'NO-29176',
            'NO-29175',
            'NO-29174',
            'NO-29173',
            'NO-29172',
            'NO-29171',
            'NO-29170',
            'NO-29169',
            'NO-29168',
            'NO-29167',
            'NO-29166',
            'NO-29165',
            'NO-29164',
            'NO-29162',
            'NO-29161',
            'NO-29160',
            'NO-29159',
            'NO-29158',
            'NO-29157',
            'NO-29156',
            'NO-29155',
            'NO-29154',
            'NO-29153',
            'NO-29152',
            'NO-29150',
            'NO-29149',
            'NO-29147',
            'NO-29146',
            'NO-29145',
            'NO-29122',
            'NO-29114',
            'NO-29085',
            'NO-29017',
            'NO-29016',
            'NO-28963',
            'NO-28882',
            'NO-28870',
            'NO-28869',
            'NO-28866',
            'NO-28859',
            'NO-28851',
            'NO-28790',
            'NO-28789',
            'NO-28788',
            'NO-28787',
            'NO-28680',
            'NO-28666',
            'NO-28663',
            'NO-28633',
            'NO-28631',
            'NO-28628',
            'NO-28593',
            'NO-28582',
            'NO-28580',
            'NO-28573',
            'NO-28548',
            'NO-28547',
            'NO-28546',
            'NO-28533',
            'NO-28532',
            'NO-28530',
            'NO-28527',
            'NO-28493',
            'NO-28473',
            'NO-28472',
            'NO-28471',
            'NO-28461',
            'NO-28454',
            'NO-28446',
            'NO-28445',
            'NO-28407',
            'NO-28406',
            'NO-28405',
            'NO-28376',
            'NO-28374',
            'NO-28373',
            'NO-28367',
            'NO-28366',
            'NO-28353',
            'NO-28352',
            'NO-28351',
            'NO-28350',
            'NO-28348',
            'NO-28321',
            'NO-28320',
            'NO-28319',
            'NO-28318',
            'NO-28305',
            'NO-28301',
            'NO-28300',
            'NO-28297',
            'NO-28296',
            'NO-28291',
            'NO-28290',
            'NO-28287',
            'NO-28286',
            'NO-28285',
            'NO-28273',
            'NO-28270',
            'NO-28268',
            'NO-28264',
            'NO-28263',
            'NO-28257',
            'NO-28252',
            'NO-28246',
            'NO-28245',
            'NO-28228',
            'NO-28226',
            'NO-28225',
            'NO-28224',
            'NO-28222',
            'NO-28221',
            'NO-28219',
            'NO-28218',
            'NO-28217',
            'NO-28211',
            'NO-28210',
            'NO-28209',
            'NO-28208',
            'NO-28207',
            'NO-28206',
            'NO-28205',
            'NO-28204',
            'NO-28203',
            'NO-28198',
            'NO-28157',
            'NO-28156',
            'NO-28155',
            'NO-28153',
            'NO-28134',
            'NO-28133',
            'NO-28132',
            'NO-28121',
            'NO-28116',
            'NO-28112',
            'NO-28111',
            'NO-28110',
            'NO-28109',
            'NO-28108',
            'NO-28107',
            'NO-28105',
            'NO-28104',
            'NO-28102',
            'NO-28100',
            'NO-28097',
            'NO-28096',
            'NO-28095',
            'NO-28093',
            'NO-28092',
            'NO-28091',
            'NO-28090',
            'NO-28085',
            'NO-28083',
            'NO-28082',
            'NO-28081',
            'NO-28080',
            'NO-28078',
            'NO-28077',
            'NO-28076',
            'NO-28067',
            'NO-28064',
            'NO-28063',
            'NO-28062',
            'NO-28061',
            'NO-28058',
            'NO-28048',
            'NO-28047',
            'NO-28045',
            'NO-28044',
            'NO-28043',
            'NO-28042',
            'NO-28041',
            'NO-28040',
            'NO-28036',
            'NO-28033',
            'NO-28031',
            'NO-28028',
            'NO-28027',
            'NO-28026',
            'NO-28025',
            'NO-28024',
            'NO-28005',
            'NO-28004',
            'NO-28003',
            'NO-28002',
            'NO-27999',
            'NO-27998',
            'NO-27997',
            'NO-27996',
            'NO-27991',
            'NO-27987',
            'NO-27985',
            'NO-27984',
            'NO-27957',
            'NO-27955',
            'NO-27954',
            'NO-27953',
            'NO-27952',
            'NO-27933',
            'NO-27931',
            'NO-27930',
            'NO-27929',
            'NO-27928',
            'NO-27927',
            'NO-27926',
            'NO-27925',
            'NO-27923',
            'NO-27918',
            'NO-27917',
            'NO-27916',
            'NO-27914',
            'NO-27913',
            'NO-27907',
            'NO-27906',
            'NO-27905',
            'NO-27902',
            'NO-27901',
            'NO-27894',
            'NO-27891',
            'NO-27887',
            'NO-27886',
            'NO-27877',
            'NO-27876',
            'NO-27875',
            'NO-27874',
            'NO-27873',
            'NO-27872',
            'NO-27871',
            'NO-27870',
            'NO-27869',
            'NO-27868',
            'NO-27867',
            'NO-27866',
            'NO-27865',
            'NO-27863',
            'NO-27862',
            'NO-27859',
            'NO-27858',
            'NO-27857',
            'NO-27856',
            'NO-27855',
            'NO-27854',
            'NO-27853',
            'NO-27850',
            'NO-27849',
            'NO-27848',
            'NO-27831',
            'NO-27829',
            'NO-27828',
            'NO-27826',
            'NO-27824',
            'NO-27823',
            'NO-27822',
            'NO-27821',
            'NO-27820',
            'NO-27819',
            'NO-27818',
            'NO-27817',
            'NO-27816',
            'NO-27815',
            'NO-27814',
            'NO-27813',
            'NO-27812',
            'NO-27811',
            'NO-27810',
            'NO-27809',
            'NO-27808',
            'NO-27807',
            'NO-27806',
            'NO-27780',
            'NO-27776',
            'NO-27762',
            'NO-27761',
            'NO-27760',
            'NO-27759',
            'NO-27758',
            'NO-27757',
            'NO-27756',
            'NO-27754',
            'NO-27753',
            'NO-27752',
            'NO-27751',
            'NO-27750',
            'NO-27749',
            'NO-27748',
            'NO-27747',
            'NO-27746',
            'NO-27745',
            'NO-27744',
            'NO-27743',
            'NO-27742',
            'NO-27741',
            'NO-27740',
            'NO-27739',
            'NO-27738',
            'NO-27737',
            'NO-27736',
            'NO-27735',
            'NO-27734',
            'NO-27733',
            'NO-27732',
            'NO-27731',
            'NO-27730',
            'NO-27729',
            'NO-27727',
            'NO-27726',
            'NO-27725',
            'NO-27724',
            'NO-27723',
            'NO-27722',
            'NO-27721',
            'NO-27720',
            'NO-27719',
            'NO-27718',
            'NO-27717',
            'NO-27716',
            'NO-27715',
            'NO-27705',
            'NO-27688',
            'NO-27686',
            'NO-27675',
            'NO-27674',
            'NO-27673',
            'NO-27672',
            'NO-27671',
            'NO-27669',
            'NO-27667',
            'NO-27636',
            'NO-27635',
            'NO-27631',
            'NO-27603',
            'NO-27563',
            'NO-27562',
            'NO-27561',
            'NO-27560',
            'NO-27558',
            'NO-27556',
            'NO-27554',
            'NO-27553',
            'NO-27534',
            'NO-27525',
            'NO-27524',
            'NO-27523',
            'NO-27522',
            'NO-27521',
            'NO-27520',
            'NO-27519',
            'NO-27518',
            'NO-27517',
            'NO-27516',
            'NO-27515',
            'NO-27514',
            'NO-27512',
            'NO-27511',
            'NO-27510',
            'NO-27509',
            'NO-27508',
            'NO-27507',
            'NO-27506',
            'NO-27505',
            'NO-27504',
            'NO-27503',
            'NO-27500',
            'NO-27499',
            'NO-27497',
            'NO-27496',
            'NO-27495',
            'NO-27494',
            'NO-27493',
            'NO-27492',
            'NO-27491',
            'NO-27490',
            'NO-27489',
            'NO-27488',
            'NO-27487',
            'NO-27486',
            'NO-27485',
            'NO-27484',
            'NO-27483',
            'NO-27482',
            'NO-27481',
            'NO-27480',
            'NO-27479',
            'NO-27478',
            'NO-27477',
            'NO-27476',
            'NO-27475',
            'NO-27474',
            'NO-27473',
            'NO-27471',
            'NO-27470',
            'NO-27468',
            'NO-27466',
            'NO-27465',
            'NO-27463',
            'NO-27462',
            'NO-27461',
            'NO-27460',
            'NO-27459',
            'NO-27458',
            'NO-27457',
            'NO-27456',
            'NO-27455',
            'NO-27454',
            'NO-27453',
            'NO-27452',
            'NO-27451',
            'NO-27450',
            'NO-27449',
            'NO-27448',
            'NO-27447',
            'NO-27446',
            'NO-27445',
            'NO-27444',
            'NO-27443',
            'NO-27442',
            'NO-27441',
            'NO-27440',
            'NO-27438',
            'NO-27437',
            'NO-27436',
            'NO-27435',
            'NO-27434',
            'NO-27432',
            'NO-27430',
            'NO-27429',
            'NO-27428',
            'NO-27427',
            'NO-27426',
            'NO-27425',
            'NO-27424',
            'NO-27423',
            'NO-27422',
            'NO-27421',
            'NO-27420',
            'NO-27419',
            'NO-27418',
            'NO-27417',
            'NO-27416',
            'NO-27415',
            'NO-27414',
            'NO-27413',
            'NO-27412',
            'NO-27411',
            'NO-27410',
            'NO-27409',
            'NO-27408',
            'NO-27406',
            'NO-27405',
            'NO-27404',
            'NO-27403',
            'NO-27402',
            'NO-27401',
            'NO-27400',
            'NO-27399',
            'NO-27398',
            'NO-27397',
            'NO-27396',
            'NO-27395',
            'NO-27394',
            'NO-27393',
            'NO-27392',
            'NO-27391',
            'NO-27390',
            'NO-27389',
            'NO-27388',
            'NO-27387',
            'NO-27386',
            'NO-27385',
            'NO-27384',
            'NO-27383',
            'NO-27382',
            'NO-27381',
            'NO-27380',
            'NO-27379',
            'NO-27378',
            'NO-27377',
            'NO-27224',
            'NO-27223',
            'NO-27222',
            'NO-27221',
            'NO-27220',
            'NO-27219',
            'NO-27218',
            'NO-27217',
            'NO-27216',
            'NO-27215',
            'NO-27214',
            'NO-27213',
            'NO-27211',
            'NO-27176',
            'NO-27175',
            'NO-27172',
            'NO-27157',
            'NO-27155',
            'NO-27154',
            'NO-27153',
            'NO-27152',
            'NO-27151',
            'NO-27150',
            'NO-27149',
            'NO-27148',
            'NO-27147',
            'NO-27129',
            'NO-27128',
            'NO-27127',
            'NO-27126',
            'NO-27120',
            'NO-27119',
            'NO-27118',
            'NO-27111',
            'NO-27109',
            'NO-27108',
            'NO-27105',
            'NO-27101',
            'NO-27100',
            'NO-27098',
            'NO-27097',
            'NO-27096',
            'NO-27095',
            'NO-27094',
            'NO-27090',
            'NO-27088',
            'NO-27087',
            'NO-27086',
            'NO-27085',
            'NO-27084',
            'NO-27082',
            'NO-27081',
            'NO-27080',
            'NO-27078',
            'NO-27067',
            'NO-27062',
            'NO-27061',
            'NO-27053',
            'NO-27052',
            'NO-27051',
            'NO-27049',
            'NO-27048',
            'NO-27047',
            'NO-27046',
            'NO-27042',
            'NO-27040',
            'NO-27036',
            'NO-27035',
            'NO-27034',
            'NO-27033',
            'NO-27032',
            'NO-27031',
            'NO-27023',
            'NO-27022',
            'NO-27020',
            'NO-27019',
            'NO-27018',
            'NO-27017',
            'NO-27016',
            'NO-27015',
            'NO-27014',
            'NO-27013',
            'NO-27012',
            'NO-27011',
            'NO-27010',
            'NO-27008',
            'NO-27002',
            'NO-27001',
            'NO-27000',
            'NO-26993',
            'NO-26992',
            'NO-26985',
            'NO-26984',
            'NO-26983',
            'NO-26982',
            'NO-26981',
            'NO-26980',
            'NO-26979',
            'NO-26978',
            'NO-26977',
            'NO-26976',
            'NO-26975',
            'NO-26974',
            'NO-26973',
            'NO-26960',
            'NO-26958',
            'NO-26957',
            'NO-26956',
            'NO-26955',
            'NO-26954',
            'NO-26953',
            'NO-26952',
            'NO-26951',
            'NO-26949',
            'NO-26948',
            'NO-26947',
            'NO-26946',
            'NO-26945',
            'NO-26944',
            'NO-26941',
            'NO-26940',
            'NO-26938',
            'NO-26937',
            'NO-26936',
            'NO-26935',
            'NO-26934',
            'NO-26933',
            'NO-26932',
            'NO-26931',
            'NO-26930',
            'NO-26928',
            'NO-26927',
            'NO-26926',
            'NO-26925',
            'NO-26922',
            'NO-26921',
            'NO-26920',
            'NO-26919',
            'NO-26918',
            'NO-26917',
            'NO-26916',
            'NO-26915',
            'NO-26914',
            'NO-26913',
            'NO-26912',
            'NO-26911',
            'NO-26910',
            'NO-26909',
            'NO-26908',
            'NO-26907',
            'NO-26906',
            'NO-26904',
            'NO-26902',
            'NO-26901',
            'NO-26900',
            'NO-26899',
            'NO-26898',
            'NO-26895',
            'NO-26894',
            'NO-26893',
            'NO-26892',
            'NO-26890',
            'NO-26889',
            'NO-26887',
            'NO-26886',
            'NO-26885',
            'NO-26884',
            'NO-26883',
            'NO-26880',
            'NO-26867',
            'NO-26866',
            'NO-26865',
            'NO-26863',
            'NO-26861',
            'NO-26860',
            'NO-26859',
            'NO-26856',
            'NO-26855',
            'NO-26854',
            'NO-26852',
            'NO-26843',
            'NO-26842',
            'NO-26841',
            'NO-26832',
            'NO-26831',
            'NO-26830',
            'NO-26829',
            'NO-26828',
            'NO-26827',
            'NO-26814',
            'NO-26809',
            'NO-26808',
            'NO-26807',
            'NO-26806',
            'NO-26805',
            'NO-26798',
            'NO-26792',
            'NO-26787',
            'NO-26783',
            'NO-26766',
            'NO-26765',
            'NO-26760',
            'NO-26757',
            'NO-26754',
            'NO-26753',
            'NO-26752',
            'NO-26750',
            'NO-26749',
            'NO-26748',
            'NO-26747',
            'NO-26746',
            'NO-26745',
            'NO-26744',
            'NO-26743',
            'NO-26741',
            'NO-26739',
            'NO-26737',
            'NO-26736',
            'NO-26735',
            'NO-26734',
            'NO-26733',
            'NO-26729',
            'NO-26728',
            'NO-26727',
            'NO-26725',
            'NO-26724',
            'NO-26722',
            'NO-26720',
            'NO-26717',
            'NO-26715',
            'NO-26714',
            'NO-26713',
            'NO-26712',
            'NO-26711',
            'NO-26710',
            'NO-26707',
            'NO-26705',
            'NO-26703',
            'NO-26702',
            'NO-26701',
            'NO-26695',
            'NO-26689',
            'NO-26686',
            'NO-26685',
            'NO-26684',
            'NO-26683',
            'NO-26682',
            'NO-26681',
            'NO-26680',
            'NO-26679',
            'NO-26677',
            'NO-26672',
            'NO-26671',
            'NO-26669',
            'NO-26668',
            'NO-26667',
            'NO-26666',
            'NO-26665',
            'NO-26664',
            'NO-26662',
            'NO-26660',
            'NO-26659',
            'NO-26657',
            'NO-26654',
            'NO-26653',
            'NO-26652',
            'NO-26651',
            'NO-26650',
            'NO-26649',
            'NO-26648',
            'NO-26647',
            'NO-26645',
            'NO-26644',
            'NO-26643',
            'NO-26642',
            'NO-26640',
            'NO-26637',
            'NO-26636',
            'NO-26635',
            'NO-26633',
            'NO-26632',
            'NO-26631',
            'NO-26630',
            'NO-26629',
            'NO-26628',
            'NO-26627',
            'NO-26626',
            'NO-26625',
            'NO-26624',
            'NO-26623',
            'NO-26622',
            'NO-26619',
            'NO-26617',
            'NO-26616',
            'NO-26615',
            'NO-26613',
            'NO-26612',
            'NO-26611',
            'NO-26610',
            'NO-26609',
            'NO-26608',
            'NO-26607',
            'NO-26606',
            'NO-26605',
            'NO-26604',
            'NO-26603',
            'NO-26602',
            'NO-26601',
            'NO-26600',
            'NO-26599',
            'NO-26598',
            'NO-26597',
            'NO-26596',
            'NO-26595',
            'NO-26594',
            'NO-26593',
            'NO-26592',
            'NO-26590',
            'NO-26589',
            'NO-26587',
            'NO-26586',
            'NO-26585',
            'NO-26583',
            'NO-26582',
            'NO-26581',
            'NO-26580',
            'NO-26578',
            'NO-26577',
            'NO-26576',
            'NO-26575',
            'NO-26574',
            'NO-26573',
            'NO-26572',
            'NO-26571',
            'NO-26569',
            'NO-26568',
            'NO-26567',
            'NO-26566',
            'NO-26565',
            'NO-26564',
            'NO-26563',
            'NO-26562',
            'NO-26561',
            'NO-26560',
            'NO-26559',
            'NO-26558',
            'NO-26557',
            'NO-26556',
            'NO-26555',
            'NO-26554',
            'NO-26553',
            'NO-26552',
            'NO-26551',
            'NO-26550',
            'NO-26549',
            'NO-26548',
            'NO-26547',
            'NO-26546',
            'NO-26545',
            'NO-26543',
            'NO-26542',
            'NO-26541',
            'NO-26537',
            'NO-26535',
            'NO-26534',
            'NO-26531',
            'NO-26530',
            'NO-26529',
            'NO-26528',
            'NO-26527',
            'NO-26526',
            'NO-26525',
            'NO-26524',
            'NO-26523',
            'NO-26521',
            'NO-26519',
            'NO-26518',
            'NO-26517',
            'NO-26516',
            'NO-26515',
            'NO-26514',
            'NO-26513',
            'NO-26511',
            'NO-26510',
            'NO-26509',
            'NO-26508',
            'NO-26507',
            'NO-26506',
            'NO-26505',
            'NO-26503',
            'NO-26502',
            'NO-26499',
            'NO-26498',
            'NO-26496',
            'NO-26495',
            'NO-26494',
            'NO-26493',
            'NO-26492',
            'NO-26491',
            'NO-26490',
            'NO-26489',
            'NO-26488',
            'NO-26487',
            'NO-26486',
            'NO-26484',
            'NO-26483',
            'NO-26477',
            'NO-26476',
            'NO-26475',
            'NO-26474',
            'NO-26473',
            'NO-26472',
            'NO-26470',
            'NO-26468',
            'NO-26463',
            'NO-26462',
            'NO-26453',
            'NO-26425',
            'NO-26415',
            'NO-26414',
            'NO-26413',
            'NO-26412',
            'NO-26411',
            'NO-26400',
            'NO-26383',
            'NO-26382',
            'NO-26377',
            'NO-26376',
            'NO-26375',
            'NO-26374',
            'NO-26373',
            'NO-26371',
            'NO-26368',
            'NO-26366',
            'NO-26365',
            'NO-26364',
            'NO-26362',
            'NO-26361',
            'NO-26360',
            'NO-26358',
            'NO-26357',
            'NO-26356',
            'NO-26355',
            'NO-26351',
            'NO-26350',
            'NO-26349',
            'NO-26348',
            'NO-26347',
            'NO-26346',
            'NO-26345',
            'NO-26344',
            'NO-26341',
            'NO-26340',
            'NO-26339',
            'NO-26338',
            'NO-26337',
            'NO-26336',
            'NO-26335',
            'NO-26332',
            'NO-26330',
            'NO-26321',
            'NO-26320',
            'NO-26319',
            'NO-26318',
            'NO-26317',
            'NO-26316',
            'NO-26313',
            'NO-26309',
            'NO-26307',
            'NO-26306',
            'NO-26305',
            'NO-26304',
            'NO-26303',
            'NO-26302',
            'NO-26300',
            'NO-26299',
            'NO-26298',
            'NO-26297',
            'NO-26296',
            'NO-26294',
            'NO-26291',
            'NO-26290',
            'NO-26289',
            'NO-26287',
            'NO-26285',
            'NO-26284',
            'NO-26283',
            'NO-26282',
            'NO-26277',
            'NO-26276',
            'NO-26275',
            'NO-26274',
            'NO-26273',
            'NO-26272',
            'NO-26271',
            'NO-26270',
            'NO-26269',
            'NO-26268',
            'NO-26267',
            'NO-26266',
            'NO-26265',
            'NO-26262',
            'NO-26261',
            'NO-26260',
            'NO-26255',
            'NO-26254',
            'NO-26253',
            'NO-26250',
            'NO-26248',
            'NO-26247',
            'NO-26246',
            'NO-26245',
            'NO-26244',
            'NO-26243',
            'NO-26242',
            'NO-26241',
            'NO-26239',
            'NO-26238',
            'NO-26236',
            'NO-26235',
            'NO-26234',
            'NO-26233',
            'NO-26232',
            'NO-26231',
            'NO-26230',
            'NO-26229',
            'NO-26228',
            'NO-26227',
            'NO-26226',
            'NO-26225',
            'NO-26224',
            'NO-26223',
            'NO-26222',
            'NO-26221',
            'NO-26220',
            'NO-26219',
            'NO-26218',
            'NO-26217',
            'NO-26215',
            'NO-26214',
            'NO-26213',
            'NO-26212',
            'NO-26211',
            'NO-26210',
            'NO-26209',
            'NO-26208',
            'NO-26207',
            'NO-26206',
            'NO-26205',
            'NO-26204',
            'NO-26200',
            'NO-26199',
            'NO-26198',
            'NO-26197',
            'NO-26196',
            'NO-26195',
            'NO-26194',
            'NO-26193',
            'NO-26192',
            'NO-26191',
            'NO-26190',
            'NO-26189',
            'NO-26188',
            'NO-26187',
            'NO-26186',
            'NO-26185',
            'NO-26184',
            'NO-26183',
            'NO-26178',
            'NO-26176',
            'NO-26175',
            'NO-26174',
            'NO-26170',
            'NO-26162',
            'NO-26161',
            'NO-26160',
            'NO-26159',
            'NO-26158',
            'NO-26157',
            'NO-26156',
            'NO-26153',
            'NO-26151',
            'NO-26150',
            'NO-26149',
            'NO-26148',
            'NO-26146',
            'NO-26145',
            'NO-26135',
            'NO-26134',
            'NO-26133',
            'NO-26132',
            'NO-26131',
            'NO-26130',
            'NO-26129',
            'NO-26128',
            'NO-26126',
            'NO-26125',
            'NO-26124',
            'NO-26123',
            'NO-26113',
            'NO-26112',
            'NO-26111',
            'NO-26110',
            'NO-26109',
            'NO-26108',
            'NO-26102',
            'NO-26101',
            'NO-26096',
            'NO-26095',
            'NO-26094',
            'NO-26093',
            'NO-26092',
            'NO-26091',
            'NO-26090',
            'NO-26089',
            'NO-26088',
            'NO-26085',
            'NO-26082',
            'NO-26081',
            'NO-26080',
            'NO-26079',
            'NO-26078',
            'NO-26077',
            'NO-26076',
            'NO-26075',
            'NO-26074',
            'NO-26073',
            'NO-26072',
            'NO-26071',
            'NO-26070',
            'NO-26069',
            'NO-26068',
            'NO-26067',
            'NO-26066',
            'NO-26064',
            'NO-26063',
            'NO-26062',
            'NO-26061',
            'NO-26060',
            'NO-26059',
            'NO-26057',
            'NO-26056',
            'NO-26055',
            'NO-26054',
            'NO-26053',
            'NO-26048',
            'NO-26047',
            'NO-26046',
            'NO-26045',
            'NO-26044',
            'NO-26043',
            'NO-26042',
            'NO-26041',
            'NO-26040',
            'NO-26039',
            'NO-26038',
            'NO-26029',
            'NO-26028',
            'NO-26027',
            'NO-26026',
            'NO-26025',
            'NO-26020',
            'NO-26018',
            'NO-26017',
            'NO-26016',
            'NO-26013',
            'NO-26011',
            'NO-26010',
            'NO-26009',
            'NO-26008',
            'NO-26006',
            'NO-26004',
            'NO-26003',
            'NO-26002',
            'NO-26001',
            'NO-26000',
            'NO-25988',
            'NO-25987',
            'NO-25986',
            'NO-25985',
            'NO-25984',
            'NO-25983',
            'NO-25982',
            'NO-25969',
            'NO-25968',
            'NO-25967',
            'NO-25966',
            'NO-25965',
            'NO-25964',
            'NO-25963',
            'NO-25962',
            'NO-25961',
            'NO-25933',
            'NO-25922',
            'NO-25920',
            'NO-25918',
            'NO-25917',
            'NO-25916',
            'NO-25915',
            'NO-25914',
            'NO-25913',
            'NO-25912',
            'NO-25910',
            'NO-25909',
            'NO-25908',
            'NO-25907',
            'NO-25906',
            'NO-25904',
            'NO-25902',
            'NO-25901',
            'NO-25900',
            'NO-25881',
            'NO-25880',
            'NO-25878',
            'NO-25875',
            'NO-25874',
            'NO-25873',
            'NO-25872',
            'NO-25870',
            'NO-25867',
            'NO-25864',
            'NO-25851',
            'NO-25846',
            'NO-25845',
            'NO-25844',
            'NO-25843',
            'NO-25841',
            'NO-25840',
            'NO-25839',
            'NO-25838',
            'NO-25837',
            'NO-25836',
            'NO-25835',
            'NO-25833',
            'NO-25832',
            'NO-25823',
            'NO-25822',
            'NO-25807',
            'NO-25780',
            'NO-25779',
            'NO-25777',
            'NO-25776',
            'NO-25773',
            'NO-25769',
            'NO-25768',
            'NO-25767',
            'NO-25763',
            'NO-25762',
            'NO-25761',
            'NO-25760',
            'NO-25759',
            'NO-25758',
            'NO-25757',
            'NO-25756',
            'NO-25755',
            'NO-25754',
            'NO-25753',
            'NO-25752',
            'NO-25751',
            'NO-25750',
            'NO-25749',
            'NO-25748',
            'NO-25747',
            'NO-25746',
            'NO-25745',
            'NO-25744',
            'NO-25742',
            'NO-25741',
            'NO-25740',
            'NO-25739',
            'NO-25736',
            'NO-25723',
            'NO-25722',
            'NO-25721',
            'NO-25720',
            'NO-25719',
            'NO-25718',
            'NO-25717',
            'NO-25716',
            'NO-25715',
            'NO-25714',
            'NO-25713',
            'NO-25711',
            'NO-25709',
            'NO-25708',
            'NO-25705',
            'NO-25704',
            'NO-25703',
            'NO-25702',
            'NO-25701',
            'NO-25699',
            'NO-25698',
            'NO-25697',
            'NO-25694',
            'NO-25693',
            'NO-25691',
            'NO-25689',
            'NO-25688',
            'NO-25686',
            'NO-25685',
            'NO-25683',
            'NO-25681',
            'NO-25679',
            'NO-25678',
            'NO-25677',
            'NO-25676',
            'NO-25675',
            'NO-25673',
            'NO-25662',
            'NO-25661',
            'NO-25660',
            'NO-25659',
            'NO-25658',
            'NO-25657',
            'NO-25655',
            'NO-25654',
            'NO-25651',
            'NO-25650',
            'NO-25649',
            'NO-25648',
            'NO-25647',
            'NO-25646',
            'NO-25645',
            'NO-25643',
            'NO-25641',
            'NO-25640',
            'NO-25639',
            'NO-25638',
            'NO-25636',
            'NO-25635',
            'NO-25634',
            'NO-25633',
            'NO-25632',
            'NO-25631',
            'NO-25630',
            'NO-25629',
            'NO-25626',
            'NO-25625',
            'NO-25624',
            'NO-25623',
            'NO-25622',
            'NO-25621',
            'NO-25620',
            'NO-25614',
            'NO-25613',
            'NO-25607',
            'NO-25605',
            'NO-25604',
            'NO-25589',
            'NO-25588',
            'NO-25587',
            'NO-25586',
            'NO-25585',
            'NO-25584',
            'NO-25580',
            'NO-25579',
            'NO-25578',
            'NO-25577',
            'NO-25575',
            'NO-25574',
            'NO-25573',
            'NO-25572',
            'NO-25571',
            'NO-25569',
            'NO-25568',
            'NO-25567',
            'NO-25565',
            'NO-25564',
            'NO-25560',
            'NO-25559',
            'NO-25558',
            'NO-25556',
            'NO-25555',
            'NO-25554',
            'NO-25553',
            'NO-25552',
            'NO-25551',
            'NO-25550',
            'NO-25549',
            'NO-25546',
            'NO-25544',
            'NO-25543',
            'NO-25542',
            'NO-25541',
            'NO-25540',
            'NO-25539',
            'NO-25538',
            'NO-25537',
            'NO-25536',
            'NO-25535',
            'NO-25534',
            'NO-25531',
            'NO-25530',
            'NO-25529',
            'NO-25528',
            'NO-25527',
            'NO-25526',
            'NO-25525',
            'NO-25524',
            'NO-25523',
            'NO-25522',
            'NO-25521',
            'NO-25519',
            'NO-25518',
            'NO-25517',
            'NO-25516',
            'NO-25515',
            'NO-25514',
            'NO-25513',
            'NO-25512',
            'NO-25511',
            'NO-25510',
            'NO-25508',
            'NO-25507',
            'NO-25506',
            'NO-25505',
            'NO-25504',
            'NO-25503',
            'NO-25502',
            'NO-25501',
            'NO-25500',
            'NO-25499',
            'NO-25493',
            'NO-25492',
            'NO-25491',
            'NO-25490',
            'NO-25489',
            'NO-25488',
            'NO-25487',
            'NO-25476',
            'NO-25475',
            'NO-25474',
            'NO-25473',
            'NO-25470',
            'NO-25469',
            'NO-25468',
            'NO-25467',
            'NO-25466',
            'NO-25464',
            'NO-25463',
            'NO-25462',
            'NO-25457',
            'NO-25456',
            'NO-25455',
            'NO-25454',
            'NO-25453',
            'NO-25452',
            'NO-25451',
            'NO-25450',
            'NO-25449',
            'NO-25448',
            'NO-25447',
            'NO-25446',
            'NO-25445',
            'NO-25443',
            'NO-25442',
            'NO-25438',
            'NO-25437',
            'NO-25431',
            'NO-25421',
            'NO-25416',
            'NO-25415',
            'NO-25414',
            'NO-25413',
            'NO-25412',
            'NO-25411',
            'NO-25410',
            'NO-25408',
            'NO-25407',
            'NO-25405',
            'NO-25402',
            'NO-25398',
            'NO-25397',
            'NO-25396',
            'NO-25395',
            'NO-25394',
            'NO-25391',
            'NO-25390',
            'NO-25389',
            'NO-25383',
            'NO-25381',
            'NO-25380',
            'NO-25378',
            'NO-25377',
            'NO-25376',
            'NO-25375',
            'NO-25374',
            'NO-25373',
            'NO-25372',
            'NO-25370',
            'NO-25367',
            'NO-25365',
            'NO-25363',
            'NO-25357',
            'NO-25356',
            'NO-25355',
            'NO-25353',
            'NO-25350',
            'NO-25345',
            'NO-25344',
            'NO-25338',
            'NO-25337',
            'NO-25335',
            'NO-25334',
            'NO-25332',
            'NO-25330',
            'NO-25329',
            'NO-25324',
            'NO-25323',
            'NO-25322',
            'NO-25321',
            'NO-25320',
            'NO-25318',
            'NO-25317',
            'NO-25315',
            'NO-25314',
            'NO-25313',
            'NO-25312',
            'NO-25311',
            'NO-25310',
            'NO-25308',
            'NO-25307',
            'NO-25306',
            'NO-25305',
            'NO-25304',
            'NO-25302',
            'NO-25298',
            'NO-25296',
            'NO-25295',
            'NO-25294',
            'NO-25292',
            'NO-25290',
            'NO-25288',
            'NO-25285',
            'NO-25284',
            'NO-25282',
            'NO-25281',
            'NO-25280',
            'NO-25279',
            'NO-25274',
            'NO-25265',
            'NO-25264',
            'NO-25263',
            'NO-25262',
            'NO-25261',
            'NO-25260',
            'NO-25259',
            'NO-25258',
            'NO-25256',
            'NO-25255',
            'NO-25254',
            'NO-25253',
            'NO-25252',
            'NO-25251',
            'NO-25249',
            'NO-25246',
            'NO-25245',
            'NO-25244',
            'NO-25242',
            'NO-25241',
            'NO-25240',
            'NO-25239',
            'NO-25238',
            'NO-25235',
            'NO-25234',
            'NO-25233',
            'NO-25232',
            'NO-25230',
            'NO-25229',
            'NO-25228',
            'NO-25227',
            'NO-25226',
            'NO-25225',
            'NO-25224',
            'NO-25223',
            'NO-25222',
            'NO-25221',
            'NO-25220',
            'NO-25219',
            'NO-25218',
            'NO-25217',
            'NO-25216',
            'NO-25215',
            'NO-25214',
            'NO-25213',
            'NO-25212',
            'NO-25210',
            'NO-25209',
            'NO-25208',
            'NO-25206',
            'NO-25205',
            'NO-25204',
            'NO-25200',
            'NO-25199',
            'NO-25197',
            'NO-25196',
            'NO-25195',
            'NO-25194',
            'NO-25193',
            'NO-25192',
            'NO-25191',
            'NO-25190',
            'NO-25189',
            'NO-25188',
            'NO-25187',
            'NO-25185',
            'NO-25184',
            'NO-25183',
            'NO-25182',
            'NO-25181',
            'NO-25180',
            'NO-25179',
            'NO-25178',
            'NO-25177',
            'NO-25176',
            'NO-25175',
            'NO-25174',
            'NO-25173',
            'NO-25172',
            'NO-25171',
            'NO-25170',
            'NO-25168',
            'NO-25167',
            'NO-25166',
            'NO-25164',
            'NO-25163',
            'NO-25162',
            'NO-25161',
            'NO-25159',
            'NO-25158',
            'NO-25157',
            'NO-25156',
            'NO-25155',
            'NO-25154',
            'NO-25153',
            'NO-25152',
            'NO-25151',
            'NO-25150',
            'NO-25149',
            'NO-25148',
            'NO-25146',
            'NO-25144',
            'NO-25141',
            'NO-25140',
            'NO-25139',
            'NO-25138',
            'NO-25137',
            'NO-25136',
            'NO-25135',
            'NO-25134',
            'NO-25130',
            'NO-25129',
            'NO-25127',
            'NO-25126',
            'NO-25124',
            'NO-25123',
            'NO-25122',
            'NO-25120',
            'NO-25119',
            'NO-25118',
            'NO-25117',
            'NO-25116',
            'NO-25115',
            'NO-25114',
            'NO-25112',
            'NO-25110',
            'NO-25109',
            'NO-25108',
            'NO-25107',
            'NO-25106',
            'NO-25105',
            'NO-25104',
            'NO-25101',
            'NO-25100',
            'NO-25099',
            'NO-25098',
            'NO-25097',
            'NO-25096',
            'NO-25095',
            'NO-25094',
            'NO-25093',
            'NO-25092',
            'NO-25091',
            'NO-25089',
            'NO-25088',
            'NO-25087',
            'NO-25086',
            'NO-25085',
            'NO-25083',
            'NO-25082',
            'NO-25081',
            'NO-25075',
            'NO-25074',
            'NO-25071',
            'NO-25070',
            'NO-25064',
            'NO-25063',
            'NO-25062',
            'NO-25061',
            'NO-25060',
            'NO-25059',
            'NO-25058',
            'NO-25057',
            'NO-25055',
            'NO-25054',
            'NO-25053',
            'NO-25052',
            'NO-25051',
            'NO-25050',
            'NO-25049',
            'NO-25048',
            'NO-25047',
            'NO-25046',
            'NO-25044',
            'NO-25042',
            'NO-25041',
            'NO-25039',
            'NO-25037',
            'NO-25036',
            'NO-25035',
            'NO-25034',
            'NO-25032',
            'NO-25031',
            'NO-25030',
            'NO-25028',
            'NO-25026',
            'NO-25024',
            'NO-25019',
            'NO-25017',
            'NO-25016',
            'NO-25014',
            'NO-25013',
            'NO-25012',
            'NO-25011',
            'NO-25009',
            'NO-25005',
            'NO-25004',
            'NO-25003',
            'NO-24979',
            'NO-24978',
            'NO-24977',
            'NO-24976',
            'NO-24975',
            'NO-24972',
            'NO-24971',
            'NO-24970',
            'NO-24967',
            'NO-24965',
            'NO-24957',
            'NO-24919',
            'NO-24912',
            'NO-24911',
            'NO-24905',
            'NO-24904',
            'NO-24898',
            'NO-24889',
            'NO-24885',
            'NO-24880',
            'NO-24877',
            'NO-24875',
            'NO-24868',
            'NO-24867',
            'NO-24851',
            'NO-24845',
            'NO-24844',
            'NO-24839',
            'NO-24837',
            'NO-24834',
            'NO-24826',
            'NO-24816',
            'NO-24815',
            'NO-24814',
            'NO-24812',
            'NO-24811',
            'NO-24810',
            'NO-24809',
            'NO-24804',
            'NO-24803',
            'NO-24802',
            'NO-24801',
            'NO-24800',
            'NO-24796',
            'NO-24790',
            'NO-24789',
            'NO-24744',
            'NO-24611',
            'NO-24609',
            'NO-24476',
            'NO-24442',
            'NO-24423',
            'NO-24417',
            'NO-24386',
            'NO-24265',
            'NO-24136',
            'NO-24135',
            'NO-24127',
            'NO-24076',
            'NO-24010',
            'NO-23998',
            'NO-23987',
            'NO-23899',
            'NO-23727',
            'NO-23726',
            'NO-23706',
            'NO-23698',
            'NO-23666',
            'NO-23593',
            'NO-23569',
            'NO-23566',
            'NO-23565',
            'NO-23438',
            'NO-23437',
            'NO-23422',
            'NO-23420',
            'NO-23417',
            'NO-23416',
            'NO-23415',
            'NO-23411',
            'NO-23410',
            'NO-23409',
            'NO-23408',
            'NO-23407',
            'NO-23390',
            'NO-23389',
            'NO-23346',
            'NO-23345',
            'NO-23312',
            'NO-23290',
            'NO-23241',
            'NO-23240',
            'NO-23238',
            'NO-23185',
            'NO-23183',
            'NO-23181',
            'NO-23179',
            'NO-23177',
            'NO-23176',
            'NO-23175',
            'NO-23166',
            'NO-23132',
            'NO-23111',
            'NO-23090',
            'NO-23069',
            'NO-23065',
            'NO-23063',
            'NO-23059',
            'NO-23058',
            'NO-23050',
            'NO-23042',
            'NO-23038',
            'NO-23033',
            'NO-23032',
            'NO-23027',
            'NO-23023',
            'NO-23022',
            'NO-23016',
            'NO-23015',
            'NO-23014',
            'NO-22993',
            'NO-22992',
            'NO-22991',
            'NO-22989',
            'NO-22986',
            'NO-22965',
            'NO-22956',
            'NO-22946',
            'NO-22937',
            'NO-22935',
            'NO-22934',
            'NO-22933',
            'NO-22932',
            'NO-22931',
            'NO-22929',
            'NO-22928',
            'NO-22926',
            'NO-22925',
            'NO-22905',
            'NO-22903',
            'NO-22887',
            'NO-22703',
            'NO-22600',
            'NO-22585',
            'NO-22577',
            'NO-22575',
            'NO-22568',
            'NO-22563',
            'NO-22561',
            'NO-22559',
            'NO-22539',
            'NO-22532',
            'NO-22447',
            'NO-22395',
            'NO-22392',
            'NO-22387',
            'NO-22367',
            'NO-22366',
            'NO-22365',
            'NO-22364',
            'NO-22320',
            'NO-22317',
            'NO-22315',
            'NO-22314',
            'NO-22282',
            'NO-22265',
            'NO-22233',
            'NO-22191',
            'NO-22190',
            'NO-22189',
            'NO-22146',
            'NO-22095',
            'NO-22092',
            'NO-22037',
            'NO-22027',
            'NO-22021',
            'NO-21814',
            'NO-21812',
            'NO-21748',
            'NO-21747',
            'NO-21726',
            'NO-21725',
            'NO-21708',
            'NO-21699',
            'NO-21695',
            'NO-21688',
            'NO-21687',
            'NO-21681',
            'NO-21678',
            'NO-21674',
            'NO-21662',
            'NO-21631',
            'NO-21630',
            'NO-21603',
            'NO-21599',
            'NO-21588',
            'NO-21587',
            'NO-21482',
            'NO-21398',
            'NO-21381',
            'NO-21379',
            'NO-21362',
            'NO-21360',
            'NO-21341',
            'NO-21335',
            'NO-21289',
            'NO-21288',
            'NO-21198',
            'NO-21194',
            'NO-21181',
            'NO-21140',
            'NO-21139',
            'NO-20987',
            'NO-20970',
            'NO-20960',
            'NO-20958',
            'NO-20955',
            'NO-20952',
            'NO-20881',
            'NO-20880',
            'NO-20879',
            'NO-20878',
            'NO-20872',
            'NO-20871',
            'NO-20869',
            'NO-20860',
            'NO-20837',
            'NO-20835',
            'NO-20827',
            'NO-20817',
            'NO-20811',
            'NO-20793',
            'NO-20787',
            'NO-20779',
            'NO-20764',
            'NO-20762',
            'NO-20761',
            'NO-20735',
            'NO-20733',
            'NO-20720',
            'NO-20716',
            'NO-20715',
            'NO-20711',
            'NO-20710',
            'NO-20706',
            'NO-20705',
            'NO-20704',
            'NO-20678',
            'NO-20676',
            'NO-20674',
            'NO-20673',
            'NO-20672',
            'NO-20670',
            'NO-20668',
            'NO-20658',
            'NO-20655',
            'NO-20653',
            'NO-20652',
            'NO-20644',
            'NO-20611',
            'NO-20589',
            'NO-20586',
            'NO-20585',
            'NO-20570',
            'NO-20569',
            'NO-20567',
            'NO-20565',
            'NO-20564',
            'NO-20563',
            'NO-20561',
            'NO-20560',
            'NO-20559',
            'NO-20558',
            'NO-20557',
            'NO-20556',
            'NO-20555',
            'NO-20553',
            'NO-20551',
            'NO-20550',
            'NO-20548',
            'NO-20547',
            'NO-20544',
            'NO-20543',
            'NO-20542',
            'NO-20541',
            'NO-20540',
            'NO-20537',
            'NO-20536',
            'NO-20535',
            'NO-20534',
            'NO-20533',
            'NO-20531',
            'NO-20530',
            'NO-20528',
            'NO-20527',
            'NO-20526',
            'NO-20524',
            'NO-20523',
            'NO-20518',
            'NO-20517',
            'NO-20515',
            'NO-20514',
            'NO-20513',
            'NO-20512',
            'NO-20511',
            'NO-20506',
            'NO-20505',
            'NO-20503',
            'NO-20502',
            'NO-20501',
            'NO-20498',
            'NO-20495',
            'NO-20493',
            'NO-20492',
            'NO-20486',
            'NO-20480',
            'NO-20475',
            'NO-20473',
            'NO-20443',
            'NO-20420',
            'NO-20417',
            'NO-20403',
            'NO-20359',
            'NO-20357',
            'NO-20355',
            'NO-20333',
            'NO-20301',
            'NO-20289',
            'NO-20288',
            'NO-20287',
            'NO-20282',
            'NO-20278',
            'NO-20244',
            'NO-20242',
            'NO-20235',
            'NO-20233',
            'NO-20229',
            'NO-20228',
            'NO-20213',
            'NO-20195',
            'NO-20192',
            'NO-20184',
            'NO-20175',
            'NO-20161',
            'NO-20160',
            'NO-20157',
            'NO-20153',
            'NO-20152',
            'NO-20151',
            'NO-20150',
            'NO-20148',
            'NO-20134',
            'NO-20132',
            'NO-20126',
            'NO-20124',
            'NO-20104',
            'NO-20102',
            'NO-20099',
            'NO-20097',
            'NO-20095',
            'NO-20076',
            'NO-20049',
            'NO-20046',
            'NO-20045',
            'NO-20044',
            'NO-20009',
            'NO-20000',
            'NO-19923',
            'NO-19922',
            'NO-19921',
            'NO-19919',
            'NO-19916',
            'NO-19915',
            'NO-19914',
            'NO-19908',
            'NO-19907',
            'NO-19904',
            'NO-19902',
            'NO-19894',
            'NO-19889',
            'NO-19888',
            'NO-19885',
            'NO-19883',
            'NO-19867',
            'NO-19864',
            'NO-19862',
            'NO-19860',
            'NO-19858',
            'NO-19829',
            'NO-19827',
            'NO-19815',
            'NO-19814',
            'NO-19812',
            'NO-19808',
            'NO-19804',
            'NO-19802',
            'NO-19800',
            'NO-19793',
            'NO-19791',
            'NO-19790',
            'NO-19789',
            'NO-19788',
            'NO-19787',
            'NO-19785',
            'NO-19782',
            'NO-19777',
            'NO-19776',
            'NO-19740',
            'NO-19682',
            'NO-19598',
            'NO-19597',
            'NO-19596',
            'NO-19592',
            'NO-19586',
            'NO-19584',
            'NO-19578',
            'NO-19576',
            'NO-19575',
            'NO-19573',
            'NO-19571',
            'NO-19569',
            'NO-19565',
            'NO-19564',
            'NO-19563',
            'NO-19562',
            'NO-19547',
            'NO-19542',
            'NO-19538',
            'NO-19537',
            'NO-19536',
            'NO-19529',
            'NO-19484',
            'NO-19469',
            'NO-19467',
            'NO-19464',
            'NO-19463',
            'NO-19461',
            'NO-19459',
            'NO-19457',
            'NO-19454',
            'NO-19453',
            'NO-19440',
            'NO-19437',
            'NO-19339',
            'NO-19206',
            'NO-19200',
            'NO-19198',
            'NO-19197',
            'NO-19193',
            'NO-19192',
            'NO-19191',
            'NO-19156',
            'NO-19153',
            'NO-19146',
            'NO-19102',
            'NO-19101',
            'NO-19100',
            'NO-19094',
            'NO-19093',
            'NO-19092',
            'NO-19091',
            'NO-19090',
            'NO-19088',
            'NO-19087',
            'NO-19086',
            'NO-19085',
            'NO-19081',
            'NO-19076',
            'NO-19074',
            'NO-19073',
            'NO-19071',
            'NO-19069',
            'NO-19059',
            'NO-19058',
            'NO-19048',
            'NO-19046',
            'NO-19031',
            'NO-19030',
            'NO-19026',
            'NO-19017',
            'NO-19013',
            'NO-19000',
            'NO-18999',
            'NO-18996',
            'NO-18994',
            'NO-18977',
            'NO-18956',
            'NO-18955',
            'NO-18950',
            'NO-18949',
            'NO-18948',
            'NO-18945',
            'NO-18944',
            'NO-18943',
            'NO-18942',
            'NO-18941',
            'NO-18939',
            'NO-18935',
            'NO-18934',
            'NO-18933',
            'NO-18931',
            'NO-18930',
            'NO-18928',
            'NO-18927',
            'NO-18925',
            'NO-18917',
            'NO-18915',
            'NO-18914',
            'NO-18888',
            'NO-18887',
            'NO-18884',
            'NO-18880',
            'NO-18877',
            'NO-18871',
            'NO-18870',
            'NO-18849',
            'NO-18848',
            'NO-18847',
            'NO-18846',
            'NO-18844',
            'NO-18843',
            'NO-18842',
            'NO-18841',
            'NO-18839',
            'NO-18838',
            'NO-18837',
            'NO-18835',
            'NO-18834',
            'NO-18831',
            'NO-18830',
            'NO-18828',
            'NO-18825',
            'NO-18818',
            'NO-18817',
            'NO-18814',
            'NO-18813',
            'NO-18811',
            'NO-18808',
            'NO-18807',
            'NO-18806',
            'NO-18805',
            'NO-18804',
            'NO-18802',
            'NO-18801',
            'NO-18800',
            'NO-18799',
            'NO-18798',
            'NO-18795',
            'NO-18794',
            'NO-18792',
            'NO-18673',
            'NO-18533',
            'NO-18504',
            'NO-18497',
            'NO-18492',
            'NO-18491',
            'NO-18490',
            'NO-18489',
            'NO-18483',
            'NO-18481',
            'NO-18474',
            'NO-18471',
            'NO-18467',
            'NO-18439',
            'NO-18438',
            'NO-18436',
            'NO-18423',
            'NO-18417',
            'NO-18415',
            'NO-18414',
            'NO-18412',
            'NO-18406',
            'NO-18403',
            'NO-18402',
            'NO-18400',
            'NO-18399',
            'NO-18398',
            'NO-18397',
            'NO-18395',
            'NO-18394',
            'NO-18390',
            'NO-18389',
            'NO-18388',
            'NO-18387',
            'NO-18385',
            'NO-07082',
            'NO-07079',
            'NO-07078',
            'NO-07077',
            'NO-07076',
            'NO-07075',
            'NO-07074',
            'NO-07073',
            'NO-07071',
            'NO-07069',
            'NO-07068',
            'NO-07067',
            'NO-07062',
            'NO-07049',
            'NO-07046',
            'NO-07045',
            'NO-07044',
            'NO-07043',
            'NO-07035',
            'NO-07032',
            'NO-07030',
            'NO-07019',
            'NO-07014',
            'NO-07011',
            'NO-07009',
            'NO-07005',
            'NO-07002',
            'NO-07001',
            'NO-07000',
            'NO-06998',
            'NO-06997',
            'NO-06996',
            'NO-06994',
            'NO-06990',
            'NO-06980',
            'NO-06977',
            'NO-06975',
            'NO-06973',
            'NO-06971',
            'NO-06965',
            'NO-06959',
            'NO-06957',
            'NO-06954',
            'NO-06953',
            'NO-06948',
            'NO-06946',
            'NO-06941',
            'NO-06931',
            'NO-06928',
            'NO-06914',
            'NO-06913',
            'NO-06903',
            'NO-06897',
            'NO-06896',
            'NO-06887',
            'NO-06880',
            'NO-06879',
            'NO-06878',
            'NO-06874',
            'NO-06872',
            'NO-06867',
            'NO-06865',
            'NO-06863',
            'NO-06861',
            'NO-06856',
            'NO-06852',
            'NO-06840',
            'NO-06834',
            'NO-06833',
            'NO-06829',
            'NO-06822',
            'NO-06821',
            'NO-06815',
            'NO-06813',
            'NO-06807',
            'NO-06804',
            'NO-06802',
            'NO-06798',
            'NO-06797',
            'NO-06795',
            'NO-06793',
            'NO-06789',
            'NO-06782',
            'NO-06779',
            'NO-06771',
            'NO-06765',
            'NO-06762',
            'NO-06756',
            'NO-06755',
            'NO-06749',
            'NO-06735',
            'NO-06729',
            'NO-06728',
            'NO-06727',
            'NO-06725',
            'NO-06724',
            'NO-06723',
            'NO-06720',
            'NO-06716',
            'NO-06714',
            'NO-06709',
            'NO-06702',
            'NO-06694',
            'NO-06693',
            'NO-06689',
            'NO-06688',
            'NO-06686',
            'NO-06680',
            'NO-06679',
            'NO-06677',
            'NO-06676',
            'NO-06675',
            'NO-06673',
            'NO-06670',
            'NO-06668',
            'NO-06659',
            'NO-06657',
            'NO-06647',
            'NO-06646',
            'NO-06633',
            'NO-06622',
            'NO-06621',
            'NO-06618',
            'NO-06610',
            'NO-06607',
            'NO-06605',
            'NO-06601',
            'NO-06600',
            'NO-06598',
            'NO-06595',
            'NO-06594',
            'NO-06592',
            'NO-06587',
            'NO-06581',
            'NO-06579',
            'NO-06574',
            'NO-06568',
            'NO-06566',
            'NO-06561',
            'NO-06560',
            'NO-06556',
            'NO-06554',
            'NO-06553',
            'NO-06549',
            'NO-06543',
            'NO-06540',
            'NO-06536',
            'NO-06527',
            'NO-06523',
            'NO-06521',
            'NO-06513',
            'NO-06512',
            'NO-06493',
            'NO-06486',
            'NO-06484',
            'NO-06481',
            'NO-06479',
            'NO-06476',
            'NO-06473',
            'NO-06471',
            'NO-06469',
            'NO-06468',
            'NO-06467',
            'NO-06284',
            'NO-06283',
            'NO-06270',
            'NO-06254',
            'NO-06235',
            'NO-06212',
            'NO-06185',
            'NO-06169',
            'NO-06164',
            'NO-06163',
            'NO-06162',
            'NO-06150',
            'NO-06149',
            'NO-06065',
            'NO-05698',
            'NO-05692',
            'NO-05680',
            'NO-05679',
            'NO-05083',
            'NO-05081',
            'NO-05077',
            'NO-05075',
            'NO-05064',
            'NO-05063',
            'NO-04938',
            'NO-04937',
            'NO-04935',
            'NO-04934',
            'NO-04932',
            'NO-04931',
            'NO-04929',
            'NO-04928',
            'NO-04927',
            'NO-04926',
            'NO-04921',
            'NO-04918',
            'NO-04915',
            'NO-04911',
            'NO-04903',
            'NO-04902',
            'NO-04901',
            'NO-04900',
            'NO-04899',
            'NO-04893',
            'NO-04891',
            'NO-04889',
            'NO-04888',
            'NO-04887',
            'NO-04884',
            'NO-04879',
            'NO-04876',
            'NO-04874',
            'NO-04871',
            'NO-04870',
            'NO-04868',
            'NO-04861',
            'NO-04860',
            'NO-04856',
            'NO-04855',
            'NO-04854',
            'NO-04851',
            'NO-04845',
            'NO-04843',
            'NO-04842',
            'NO-04834',
            'NO-04833',
            'NO-04832',
            'NO-04830',
            'NO-04828',
            'NO-04827',
            'NO-04826',
            'NO-04825',
            'NO-04823',
            'NO-04822',
            'NO-04815',
            'NO-04812',
            'NO-04811',
            'NO-04810',
            'NO-04803',
            'NO-04802',
            'NO-04801',
            'NO-04800',
            'NO-04794',
            'NO-04793',
            'NO-04792',
            'NO-04786',
            'NO-04785',
            'NO-04781',
            'NO-04778',
            'NO-04777',
            'NO-04776',
            'NO-04775',
            'NO-04770',
            'NO-04769',
            'NO-04766',
            'NO-04764',
            'NO-04761',
            'NO-04758',
            'NO-04753',
            'NO-04752',
            'NO-04750',
            'NO-04728',
            'NO-04721',
            'NO-04682',
            'NO-04675',
            'NO-04673',
            'NO-04656',
            'NO-04649',
            'NO-04648',
            'NO-04641',
            'NO-04638',
            'NO-04636',
            'NO-04616',
            'NO-04584',
            'NO-04580',
            'NO-04573',
            'NO-04572',
            'NO-04566',
            'NO-04565',
            'NO-04558',
            'NO-04557',
            'NO-04553',
            'NO-04552',
            'NO-04551',
            'NO-04549',
            'NO-04543',
            'NO-04541',
            'NO-04539',
            'NO-04537',
            'NO-04534',
            'NO-04526',
            'NO-04522',
            'NO-04521',
            'NO-04520',
            'NO-04519',
            'NO-04516',
            'NO-04511',
            'NO-04509',
            'NO-04501',
            'NO-04500',
            'NO-04498',
            'NO-04477',
            'NO-04473',
            'NO-04469',
            'NO-04468',
            'NO-04466',
            'NO-04465',
            'NO-04463',
            'NO-04461',
            'NO-04459',
            'NO-04456',
            'NO-04454',
            'NO-04452',
            'NO-04451',
            'NO-04445',
            'NO-04439',
            'NO-04437',
            'NO-04436',
            'NO-04434',
            'NO-04432',
            'NO-04429',
            'NO-04426',
            'NO-04424',
            'NO-04423',
            'NO-04421',
            'NO-04420',
            'NO-04418',
            'NO-04417',
            'NO-04414',
            'NO-04412',
            'NO-04411',
            'NO-04410',
            'NO-04409',
            'NO-04408',
            'NO-04406',
            'NO-04401',
            'NO-04398',
            'NO-04397',
            'NO-04396',
            'NO-04394',
            'NO-04393',
            'NO-04390',
            'NO-04389',
            'NO-04388',
            'NO-04387',
            'NO-04386',
            'NO-04384',
            'NO-04383',
            'NO-04382',
            'NO-04380',
            'NO-04376',
            'NO-04373',
            'NO-04372',
            'NO-04371',
            'NO-04368',
            'NO-04366',
            'NO-04364',
            'NO-04360',
            'NO-04353',
            'NO-04349',
            'NO-04346',
            'NO-04344',
            'NO-04343',
            'NO-04342',
            'NO-04316',
            'NO-04313',
            'NO-04312',
            'NO-04310',
            'NO-04309',
            'NO-04299',
            'NO-04292',
            'NO-04049',
            'NO-04035',
            'NO-04026',
            'NO-04021',
            'NO-00901',
            'NO-00899',
            'NO-00898',
            'NO-00896',
            'NO-00895',
            'NO-00894',
            'NO-00891',
            'NO-00889',
            'NO-00888',
            'NO-00886',
            'NO-00885',
            'NO-00884',
            'NO-00883',
            'NO-00882',
            'NO-00880',
            'NO-00879',
            'NO-00878',
            'NO-00875',
            'NO-00874',
            'NO-00873',
            'NO-00872',
            'NO-00866',
            'NO-00865',
            'NO-00863',
            'NO-00861',
            'NO-00859',
            'NO-00858',
            'NO-00857',
            'NO-00854',
            'NO-00853',
            'NO-00852',
            'NO-00850',
            'NO-00849',
            'NO-00848',
            'NO-00847',
            'NO-00846',
            'NO-00843',
            'NO-00842',
            'NO-00841',
            'NO-00839',
            'NO-00838',
            'NO-00836',
            'NO-00831',
            'NO-00830',
            'NO-00827',
            'NO-00826',
            'NO-00823',
            'NO-00822',
            'NO-00819',
            'NO-00815',
            'NO-00814',
            'NO-00812',
            'NO-00811',
            'NO-00810',
            'NO-00807',
            'NO-00806',
            'NO-00805',
            'NO-00803',
            'NO-00801',
            'NO-00800',
            'NO-00799',
            'NO-00797',
            'NO-00796',
            'NO-00793',
            'NO-00791',
            'NO-00790',
            'NO-00789',
            'NO-00788',
            'NO-00786',
            'NO-00785',
            'NO-00783',
            'NO-00782',
            'NO-00779',
            'NO-00777',
            'NO-00775',
            'NO-00773',
            'NO-00767',
            'NO-00766',
            'NO-00764',
            'NO-00763',
            'NO-00760',
            'NO-00759',
            'NO-00757',
            'NO-00756',
            'NO-00755',
            'NO-00753',
            'NO-00752',
            'NO-00749',
            'NO-00748',
            'NO-00747',
            'NO-00746',
            'NO-00743',
            'NO-00742',
            'NO-00741',
            'NO-00739',
            'NO-00736',
            'NO-00732',
            'NO-00731',
            'NO-00730',
            'NO-00729',
            'NO-00728',
            'NO-00727',
            'NO-00724',
            'NO-00721',
            'NO-00714',
            'NO-00713',
            'NO-00712',
            'NO-00711',
            'NO-00710',
            'NO-00709',
            'NO-00708',
            'NO-00707',
            'NO-00706',
            'NO-00705',
            'NO-00704',
            'NO-00701',
            'NO-00700',
            'NO-00699',
            'NO-00698',
            'NO-00697',
            'NO-00695',
            'NO-00694',
            'NO-00693',
            'NO-00690',
            'NO-00689',
            'NO-00687',
            'NO-00685',
            'NO-00683',
            'NO-00680',
            'NO-00678',
            'NO-00677',
            'NO-00675',
            'NO-00674',
            'NO-00673',
            'NO-00672',
            'NO-00671',
            'NO-00669',
            'NO-00668',
            'NO-00667',
            'NO-00666',
            'NO-00662',
            'NO-00660',
            'NO-00659',
            'NO-00658',
            'NO-00654',
            'NO-00653',
            'NO-00650',
            'NO-00649',
            'NO-00648',
            'NO-00646',
            'NO-00645',
            'NO-00644',
            'NO-00643',
            'NO-00642',
            'NO-00640',
            'NO-00634',
            'NO-00633',
            'NO-00632',
            'NO-00631',
            'NO-00626',
            'NO-00624',
            'NO-00623',
            'NO-00622',
            'NO-00618',
            'NO-00617',
            'NO-00614',
            'NO-00608',
            'NO-00607',
            'NO-00606',
            'NO-00603',
            'NO-00601',
            'NO-00600',
            'NO-00598',
            'NO-00595',
            'NO-00592',
            'NO-00591',
            'NO-00589',
            'NO-00587',
            'NO-00586',
            'NO-00583',
            'NO-00582',
            'NO-00580',
            'NO-00578',
            'NO-00577',
            'NO-00576',
            'NO-00575',
            'NO-00574',
            'NO-00573',
            'NO-00572',
            'NO-00571',
            'NO-00569',
            'NO-00568',
            'NO-00567',
            'NO-00566',
            'NO-00565',
            'NO-00562',
            'NO-00561',
            'NO-00558',
            'NO-00556',
            'NO-00555',
            'NO-00554',
            'NO-00553',
            'NO-00552',
            'NO-00551',
            'NO-00549',
            'NO-00547',
            'NO-00546',
            'NO-00545',
            'NO-00543',
            'NO-00542',
            'NO-00541',
            'NO-00540',
            'NO-00539',
            'NO-00536',
            'NO-00535',
            'NO-00532',
            'NO-00528',
            'NO-00526',
            'NO-00525',
            'NO-00524',
            'NO-00521',
            'NO-00520',
            'NO-00519',
            'NO-00518',
            'NO-00516',
            'NO-00513',
            'NO-00512',
            'NO-00510',
            'NO-00508',
            'NO-00507',
            'NO-00506',
            'NO-00503',
            'NO-00502',
            'NO-00496',
            'NO-00495',
            'NO-00489',
            'NO-00488',
            'NO-00480',
            'NO-00479',
            'NO-00478',
            'NO-00476',
            'NO-00472',
            'NO-00471',
            'NO-00470',
            'NO-00469',
            'NO-00465',
            'NO-00463',
            'NO-00460',
            'NO-00459',
            'NO-00458',
            'NO-00457',
            'NO-00456',
            'NO-00455',
            'NO-00454',
            'NO-00451',
            'NO-00450',
            'NO-00444',
            'NO-00441',
            'NO-00439',
            'NO-00433',
            'NO-00431',
            'NO-00428',
            'NO-00425',
            'NO-00421',
            'NO-00420',
            'NO-00419',
            'NO-00418',
            'NO-00416',
            'NO-00415',
            'NO-00413',
            'NO-00403',
            'NO-00402',
            'NO-00392',
            'NO-00391',
            'NO-00390',
            'NO-00389',
            'NO-00387',
            'NO-00208',
            'NO-00196',
            'NO-00167',
            'NO-00163',
            'NO-00151',
            'NO-00144',
            'NO-00124',
            'NO-00102',
            'NO-00098',
            'NO-00096',
            'NO-00093',
            'NO-00041',
            'NC02681-031',
            'NC01910-008',
            'NC01910-007',
            'NC01910-005',
            'NC01910-004',
            'NC01910-003',
            'NC01625-001',
            'NC01262-028',
            'NC01262-027',
            'NC01262-026',
            'NC01262-025',
            'NC01262-024',
            'NC01262-023',
            'NC01262-022',
            'NC01262-020',
            'NC01262-019',
            'NC01262-017',
            'NC01262-016',
            'NC01262-015',
            'NC01262-014',
            'NC01262-013',
            'NC01262-012',
            'NC01262-010',
            'NC01262-009',
            'NC01262-008',
            'NC01262-007',
            'NC01262-006',
            'NC01262-005',
            'NC01262-004',
            'NC01262-003',
            'NC01262-002',
            'NC01262-001',
            'NC00985-013',
            'NC00985-012',
            'NC00985-011',
            'NC00985-010',
            'NC00985-009',
            'NC00985-005',
            'NC00985-001',
            'NC00963-001',
            'NC00520-005',
            'NC00138-0001',
            'NC0005-427',
            'NC0005-426',
            'NC0005-425',
            'NC0005-424',
            'NC0005-423',
            'NC0005-422',
            'NC0005-421',
            'NC0005-420',
            'NC0005-419',
            'NC0005-417',
            'NC0005-415',
            'NC0005-413',
            'NC0005-410',
            'NC0005-408',
            'NC0005-403',
            'NC0005-398',
            'NC0005-397',
            'NC0005-391',
            'NC0005-0402',
            'NC0005-0401',
            'NC0005-0400',
            'NC0005-0396',
            'NC0005-0393',
            'NC0005-0379',
            'NC0005-0370',
            'NC0005-0368',
            'NC0005-0365',
            'NC0005-0364',
            'NC0005-0359',
            'NC0005-0352',
            'NC0005-0347',
            'NC0005-0346',
            'NC0005-0340',
            'NC0005-0338',
            'NC0005-0332',
            'NC0005-0330',
            'NC0005-0321',
            'NC0005-0317',
            'NC0005-0314',
            'NC0005-0312',
            'NC0005-0309',
            'NC0005-0308',
            'NC0005-0302',
            'NC0005-0300',
            'NC0005-0296',
            'NC0005-0294',
            'NC0005-0291',
            'NC0005-0290',
            'NC0005-0289',
            'NC0005-0287',
            'NC0005-0276',
            'NC0005-0270',
            'NC0005-0266',
            'NC0005-0248',
            'NC0005-0236',
            'NC0005-0232',
            'NC0005-0227',
            'NC0005-0224',
            'NC0005-0221',
            'NC0005-0215',
            'NC0005-0214',
            'NC0005-0210',
            'NC0005-0208',
            'NC0005-0204',
            'NC0005-0196',
            'NC0005-0192',
            'NC0005-0191',
            'NC0005-0184',
            'NC0005-0174',
            'NC0005-0173',
            'NC0005-0168',
            'NC0005-0164',
            'NC0005-0158',
            'NC0005-0148',
            'NC0005-0145',
            'NC0005-0143',
            'NC0005-0134',
            'NC0005-0132',
            'NC0005-0129',
            'NC0005-0128',
            'NC0005-0127',
            'NC0005-0126',
            'NC0005-0119',
            'NC0005-0116',
            'NC0005-0114',
            'NC0005-0111',
            'NC0005-0106',
            'NC0005-0099',
            'NC0005-0095',
            'NC0005-0091',
            'NC0005-0089',
            'NC0005-0082',
            'NC0005-0077',
            'NC0005-0071',
            'NC0005-0065',
            'NC0005-0062',
            'NC0005-0060',
            'NC0005-0059',
            'NC0005-0055',
            'NC0005-0052',
            'NC0005-0049',
            'NC0005-0044',
            'NC0005-0041',
            'NC0005-0040',
            'NC0005-0036',
            'NC0005-0029',
            'NC0005-0028',
            'NC0005-0027',
            'NC0005-0025',
            'NC0005-0021',
            'NC0005-0016',
            'NC0005-0013',
            'NC0005-0004',
            'NC00018-008',
            'NC00018-007',
            'NC00018-005',
            'NC00010-002',
            'NC00010-001',
            'NC00006-023',
            'NC00006-014',
            'C04795',
            'C04794',
            'C04791',
            'C04790',
            'C04787',
            'C04786',
            'C04784',
            'C04783',
            'C04782',
            'C04781',
            'C04779',
            'C04778',
            'C04776',
            'C04775',
            'C04772',
            'C04771',
            'C04770',
            'C04767',
            'C04765',
            'C04756',
            'C04750',
            'C04738',
            'C04734',
            'C04733',
            'C04732',
            'C04730',
            'C04728',
            'C04727',
            'C04726',
            'C04725',
            'C04721',
            'C04719',
            'C04718',
            'C04717',
            'C04716',
            'C04715',
            'C04714',
            'C04713',
            'C04711',
            'C04710',
            'C04709',
            'C04708',
            'C04707',
            'C04705',
            'C04704',
            'C04703',
            'C04701',
            'C04698',
            'C04695',
            'C04694',
            'C04692',
            'C04690',
            'C04677',
            'C04674',
            'C04672',
            'C04671',
            'C04670',
            'C04669',
            'C04668',
            'C04664',
            'C04663',
            'C04661',
            'C04658',
            'C04657',
            'C04656',
            'C04655',
            'C04653',
            'C04652',
            'C04651',
            'C04650',
            'C04645',
            'C04643',
            'C04641',
            'C04640',
            'C04639',
            'C04638',
            'C04637',
            'C04636',
            'C04631',
            'C04625',
            'C04622',
            'C04621',
            'C04620',
            'C04618',
            'C04615',
            'C04612',
            'C04611',
            'C04601',
            'C04600',
            'C04599',
            'C04598',
            'C04597',
            'C04567',
            'C04566',
            'C04565',
            'C04564',
            'C04563',
            'C04562',
            'C04561',
            'C04560',
            'C04559',
            'C04558',
            'C04557',
            'C04556',
            'C04550',
            'C04541',
            'C04536',
            'C04533',
            'C04532',
            'C04531',
            'C04530',
            'C04529',
            'C04528',
            'C04526',
            'C04525',
            'C04523',
            'C04517',
            'C04514',
            'C04512',
            'C04510',
            'C04508',
            'C04507',
            'C04498',
            'C04497',
            'C04496',
            'C04495',
            'C04492',
            'C04491',
            'C04490',
            'C04489',
            'C04487',
            'C04486',
            'C04485',
            'C04483',
            'C04482',
            'C04481',
            'C04473',
            'C04472',
            'C04467',
            'C04464',
            'C04463',
            'C04462',
            'C04461',
            'C04457',
            'C04454',
            'C04444',
            'C04438',
            'C04437',
            'C04420',
            'C04419',
            'C04418',
            'C04401',
            'C04400',
            'C04399',
            'C04398',
            'C04396',
            'C04395',
            'C04373',
            'C04358',
            'C04357',
            'C04354',
            'C04353',
            'C04352',
            'C04351',
            'C04350',
            'C04349',
            'C04348',
            'C04347',
            'C04345',
            'C04342',
            'C04339',
            'C04337',
            'C04336',
            'C04322',
            'C04321',
            'C04320',
            'C04319',
            'C04275',
            'C04272',
            'C04271',
            'C04270',
            'C04269',
            'C04268',
            'C04267',
            'C04266',
            'C04265',
            'C04264',
            'C04263',
            'C04262',
            'C04261',
            'C04259',
            'C04256',
            'C04243',
            'C04233',
            'C04221',
            'C04199',
            'C04193',
            'C04191',
            'C04189',
            'C04188',
            'C04187',
            'C04186',
            'C04185',
            'C04184',
            'C04183',
            'C04181',
            'C04178',
            'C04117',
            'C04081',
            'C04080',
            'C04079',
            'C04044',
            'C04043',
            'C04042',
            'C04034',
            'C04000',
            'C03980',
            'C03979',
            'C03978',
            'C03977',
            'C03976',
            'C03975',
            'C03901',
            'C03899',
            'C03861',
            'C03855',
            'C03852',
            'C03851',
            'C03842',
            'C03841',
            'C03839',
            'C03837',
            'C03819',
            'C03815',
            'C03791',
            'C03747',
            'C03746',
            'C03705',
            'C03704',
            'C03684',
            'C03683',
            'C03682',
            'C03669',
            'C03664',
            'C03661',
            'C03659',
            'C03649',
            'C03620',
            'C03609',
            'C03542',
            'C03502',
            'C03501',
            'C03500',
            'C03499',
            'C03496',
            'C03474',
            'C03465',
            'C03462',
            'C03461',
            'C03455',
            'C03447',
            'C03445',
            'C03440',
            'C03439',
            'C03431',
            'C03411',
            'C03410',
            'C03409',
            'C03408',
            'C03370',
            'C03325',
            'C03312',
            'C03300',
            'C03296',
            'C03280',
            'C03279',
            'C03278',
            'C03270',
            'C03253',
            'C03207',
            'C03206',
            'C03203',
            'C03191',
            'C03159',
            'C03157',
            'C03067',
            'C03066',
            'C03063',
            'C03061',
            'C03059',
            'C03025',
            'C02989',
            'C02987',
            'C02986',
            'C02985',
            'C02963',
            'C02950',
            'C02949',
            'C02947',
            'C02946',
            'C02943',
            'C02912',
            'C02909',
            'C02899',
            'C02898',
            'C02897',
            'C02895',
            'C02894',
            'C02875',
            'C02874',
            'C02853',
            'C02852',
            'C02848',
            'C02847',
            'C02846',
            'C02815',
            'C02747',
            'C02720',
            'C02718',
            'C02715',
            'C02712',
            'C02694',
            'C02691',
            'C02689',
            'C02688',
            'C02684',
            'C02651',
            'C02650',
            'C02648',
            'C02623',
            'C02621',
            'C02599',
            'C02587',
            'C02586',
            'C02585',
            'C02575',
            'C02574',
            'C02572',
            'C02571',
            'C02569',
            'C02563',
            'C02562',
            'C02561',
            'C02552',
            'C02550',
            'C02547',
            'C02541',
            'C02535',
            'C02534',
            'C02530',
            'C02526',
            'C02521',
            'C02507',
            'C02502',
            'C02498',
            'C02494',
            'C02493',
            'C02492',
            'C02490',
            'C02488',
            'C02483',
            'C02482',
            'C02478',
            'C02477',
            'C02469',
            'C02467',
            'C02459',
            'C02456',
            'C02452',
            'C02450',
            'C02446',
            'C02442',
            'C02441',
            'C02437',
            'C02436',
            'C02431',
            'C02428',
            'C02427',
            'C02426',
            'C02423',
            'C02420',
            'C02417',
            'C02415',
            'C02413',
            'C02409',
            'C02408',
            'C02407',
            'C02406',
            'C02393',
            'C02389',
            'C02387',
            'C02384',
            'C02377',
            'C02375',
            'C02362',
            'C02360',
            'C02351',
            'C02345',
            'C02335',
            'C02332',
            'C02331',
            'C02330',
            'C02322',
            'C02318',
            'C02302',
            'C02300',
            'C02295',
            'C02293',
            'C02289',
            'C02285',
            'C02280',
            'C02259',
            'C02253',
            'C02250',
            'C02246',
            'C02238',
            'C02237',
            'C02224',
            'C02220',
            'C02201',
            'C02199',
            'C02198',
            'C02196',
            'C02194',
            'C02193',
            'C02183',
            'C02165',
            'C02150',
            'C02147',
            'C02133',
            'C02121',
            'C02119',
            'C02113',
            'C02100',
            'C02096',
            'C02092',
            'C02059',
            'C02048',
            'C01990',
            'C01983',
            'C01945',
            'C01939',
            'C01932',
            'C01913',
            'C01912',
            'C01908',
            'C01904',
            'C01902',
            'C01898',
            'C01891',
            'C01889',
            'C01878',
            'C01867',
            'C01866',
            'C01864',
            'C01856',
            'C01855',
            'C01851',
            'C01837',
            'C01835',
            'C01834',
            'C01822',
            'C01821',
            'C01816',
            'C01814',
            'C01810',
            'C01806',
            'C01805',
            'C01804',
            'C01799',
            'C01795',
            'C01791',
            'C01776',
            'C01771',
            'C01769',
            'C01768',
            'C01767',
            'C01765',
            'C01763',
            'C01762',
            'C01759',
            'C01757',
            'C01755',
            'C01751',
            'C01747',
            'C01746',
            'C01745',
            'C01742',
            'C01741',
            'C01740',
            'C01739',
            'C01738',
            'C01733',
            'C01731',
            'C01726',
            'C01722',
            'C01715',
            'C01713',
            'C01712',
            'C01711',
            'C01709',
            'C01708',
            'C01707',
            'C01699',
            'C01695',
            'C01686',
            'C01680',
            'C01673',
            'C01671',
            'C01666',
            'C01665',
            'C01664',
            'C01660',
            'C01659',
            'C01658',
            'C01657',
            'C01655',
            'C01654',
            'C01650',
            'C01641',
            'C01631',
            'C01630',
            'C01628',
            'C01627',
            'C01626',
            'C01623',
            'C01622',
            'C01620',
            'C01619',
            'C01617',
            'C01614',
            'C01613',
            'C01610',
            'C01609',
            'C01606',
            'C01541',
            'C01531',
            'C01528',
            'C01527',
            'C01516',
            'C01515',
            'C01511',
            'C01495',
            'C01475',
            'C01471',
            'C01470',
            'C01468',
            'C01449',
            'C01435',
            'C01388',
            'C01384',
            'C01383',
            'C01377',
            'C01376',
            'C01375',
            'C01374',
            'C01370',
            'C01369',
            'C01367',
            'C01364',
            'C01362',
            'C01361',
            'C01360',
            'C01359',
            'C01358',
            'C01316',
            'C01315',
            'C01312',
            'C01308',
            'C01307',
            'C01304',
            'C01302',
            'C01301',
            'C01300',
            'C01298',
            'C01297',
            'C01296',
            'C01295',
            'C01292',
            'C01291',
            'C01289',
            'C01288',
            'C01285',
            'C01284',
            'C01278',
            'C01277',
            'C01275',
            'C01272',
            'C01271',
            'C01270',
            'C01268',
            'C01267',
            'C01266',
            'C01264',
            'C01259',
            'C01256',
            'C01255',
            'C01252',
            'C01251',
            'C01247',
            'C01246',
            'C01245',
            'C01244',
            'C01243',
            'C01241',
            'C01240',
            'C01238',
            'C01234',
            'C01230',
            'C01228',
            'C01226',
            'C01225',
            'C01223',
            'C01216',
            'C01213',
            'C01212',
            'C01202',
            'C01200',
            'C01182',
            'C01181',
            'C01177',
            'C01176',
            'C01175',
            'C01157',
            'C01147',
            'C01146',
            'C01145',
            'C01143',
            'C01142',
            'C01135',
            'C01133',
            'C01132',
            'C01129',
            'C01127',
            'C01125',
            'C01123',
            'C01121',
            'C01120',
            'C01119',
            'C01117',
            'C01115',
            'C01112',
            'C01111',
            'C01109',
            'C01108',
            'C01105',
            'C01104',
            'C01101',
            'C01098',
            'C01097',
            'C01095',
            'C01093',
            'C01092',
            'C01091',
            'C01088',
            'C01087',
            'C01086',
            'C01085',
            'C01084',
            'C01083',
            'C01080',
            'C01070',
            'C01069',
            'C01068',
            'C01064',
            'C01061',
            'C01060',
            'C01059',
            'C01050',
            'C01048',
            'C01047',
            'C01046',
            'C01045',
            'C01044',
            'C01042',
            'C01040',
            'C01039',
            'C01038',
            'C01037',
            'C01036',
            'C01035',
            'C01034',
            'C01032',
            'C01030',
            'C01029',
            'C01028',
            'C01025',
            'C01020',
            'C01018',
            'C01016',
            'C01015',
            'C01012',
            'C01010',
            'C01009',
            'C01005',
            'C01004',
            'C01002',
            'C01001',
            'C00999',
            'C00997',
            'C00996',
            'C00995',
            'C00991',
            'C00990',
            'C00988',
            'C00956',
            'C00953',
            'C00951',
            'C00949',
            'C00947',
            'C00946',
            'C00942',
            'C00940',
            'C00937',
            'C00936',
            'C00934',
            'C00932',
            'C00930',
            'C00920',
            'C00915',
            'C00914',
            'C00912',
            'C00911',
            'C00907',
            'C00905',
            'C00904',
            'C00893',
            'C00890',
            'C00886',
            'C00885',
            'C00884',
            'C00882',
            'C00881',
            'C00878',
            'C00877',
            'C00875',
            'C00874',
            'C00873',
            'C00869',
            'C00862',
            'C00861',
            'C00851',
            'C00849',
            'C00847',
            'C00844',
            'C00841',
            'C00836',
            'C00831',
            'C00830',
            'C00824',
            'C00817',
            'C00802',
            'C00800',
            'C00795',
            'C00790',
            'C00788',
            'C00785',
            'C00784',
            'C00783',
            'C00782',
            'C00779',
            'C00777',
            'C00775',
            'C00774',
            'C00773',
            'C00771',
            'C00768',
            'C00766',
            'C00763',
            'C00756',
            'C00755',
            'C00752',
            'C00751',
            'C00748',
            'C00747',
            'C00746',
            'C00741',
            'C00733',
            'C00731',
            'C00730',
            'C00729',
            'C00725',
            'C00723',
            'C00722',
            'C00720',
            'C00717',
            'C00716',
            'C00714',
            'C00713',
            'C00709',
            'C00708',
            'C00707',
            'C00706',
            'C00704',
            'C00699',
            'C00698',
            'C00696',
            'C00694',
            'C00693',
            'C00692',
            'C00684',
            'C00683',
            'C00682',
            'C00675',
            'C00674',
            'C00670',
            'C00668',
            'C00666',
            'C00665',
            'C00664',
            'C00663',
            'C00661',
            'C00657',
            'C00653',
            'C00651',
            'C00650',
            'C00647',
            'C00639',
            'C00632',
            'C00631',
            'C00622',
            'C00619',
            'C00618',
            'C00616',
            'C00614',
            'C00613',
            'C00611',
            'C00609',
            'C00606',
            'C00602',
            'C00594',
            'C00592',
            'C00590',
            'C00589',
            'C00583',
            'C00579',
            'C00578',
            'C00572',
            'C00561',
            'C00559',
            'C00558',
            'C00557',
            'C00556',
            'C00551',
            'C00547',
            'C00544',
            'C00542',
            'C00540',
            'C00532',
            'C00531',
            'C00528',
            'C00526',
            'C00524',
            'C00523',
            'C00512',
            'C00509',
            'C00504',
            'C00502',
            'C00496',
            'C00495',
            'C00493',
            'C00491',
            'C00490',
            'C00488',
            'C00486',
            'C00485',
            'C00484',
            'C00481',
            'C00480',
            'C00478',
            'C00475',
            'C00474',
            'C00473',
            'C00472',
            'C00468',
            'C00467',
            'C00463',
            'C00460',
            'C00459',
            'C00457',
            'C00454',
            'C00453',
            'C00452',
            'C00451',
            'C00450',
            'C00449',
            'C00448',
            'C00446',
            'C00444',
            'C00441',
            'C00439',
            'C00433',
            'C00426',
            'C00423',
            'C00422',
            'C00421',
            'C00420',
            'C00419',
            'C00418',
            'C00416',
            'C00414',
            'C00413',
            'C00412',
            'C00410',
            'C00409',
            'C00408',
            'C00407',
            'C00405',
            'C00404',
            'C00403',
            'C00400',
            'C00397',
            'C00396',
            'C00395',
            'C00393',
            'C00389',
            'C00388',
            'C00387',
            'C00384',
            'C00382',
            'C00381',
            'C00380',
            'C00379',
            'C00378',
            'C00377',
            'C00376',
            'C00374',
            'C00368',
            'C00367',
            'C00363',
            'C00361',
            'C00358',
            'C00355',
            'C00352',
            'C00348',
            'C00347',
            'C00343',
            'C00342',
            'C00341',
            'C00340',
            'C00339',
            'C00337',
            'C00333',
            'C00327',
            'C00318',
            'C00314',
            'C00312',
            'C00308',
            'C00306',
            'C00303',
            'C00302',
            'C00301',
            'C00296',
            'C00294',
            'C00291',
            'C00289',
            'C00280',
            'C00279',
            'C00278',
            'C00271',
            'C00270',
            'C00268',
            'C00264',
            'C00257',
            'C00256',
            'C00253',
            'C00252',
            'C00245',
            'C00242',
            'C00241',
            'C00237',
            'C00236',
            'C00234',
            'C00232',
            'C00230',
            'C00228',
            'C00226',
            'C00223',
            'C00222',
            'C00220',
            'C00216',
            'C00211',
            'C00210',
            'C00208',
            'C00205',
            'C00203',
            'C00201',
            'C00200',
            'C00199',
            'C00198',
            'C00197',
            'C00195',
            'C00192',
            'C00191',
            'C00190',
            'C00187',
            'C00185',
            'C00184',
            'C00183',
            'C00181',
            'C00180',
            'C00179',
            'C00177',
            'C00176',
            'C00174',
            'C00173',
            'C00172',
            'C00150',
            'C00090',
            'C0005-413',
            'C0005-412',
            'C00037',
            'C00036',
            'C00029',
            'C00026',
            'C00025',
            'C00023',
            'C00017',
            'C00016',
            'C00013',
            'C00011'];
        return filter.includes(uniqueId);
    }

async  bulkInsertSalesPointsClaimTransfer(dataArray) {
  try {
    // Ensure dataArray is an array and not empty
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('No data provided for bulk insert into sales_points_claim_transfer');
      return;
    }

    // Filter out records with missing Document_No and map valid records
    const validRecords = [];
    const skippedRecords = [];

    dataArray.forEach(data => {
      if (!data['Document_No']) {
        skippedRecords.push(data);
        console.warn(`Skipping record due to missing documentNo: ${JSON.stringify(data)}`);
      } else {
        validRecords.push({
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
          quantity: data['Quantity'],
          qualityDesc: data['Quality_Desc'],
          multiplier: data['Multiplier'],
          etag: data['ETag'],
          createdAt:data['Created_DateTime'] || sql`CURRENT_TIMESTAMP`,
          docLineNo: data['Document_No'] + '-' + data['Line_No'], // Unique identifier for conflict resolution
        });
      }
    });

    // If no valid records, log and return
    if (validRecords.length === 0) {
      console.log('No valid records to insert into sales_points_claim_transfer');
      return;
    }

    // Perform bulk insert for valid records
    await db
      .insert(salesPointsClaimTransfer)
      .values(validRecords)
      .onConflictDoUpdate({ target: salesPointsClaimTransfer.docLineNo,set:{
         isMaster: sql`EXCLUDED.Is_Master`,
          lineNo: sql`EXCLUDED.Line_No`,
          entryType: sql`EXCLUDED.Entry_Type`,
          lineType: sql`EXCLUDED.Line_Type`,
          customerNo: sql`EXCLUDED.Customer_No`,
          customerName: sql`EXCLUDED.Customer_Name`,
          agentCode: sql`EXCLUDED.Agent_Code`,
          agentName: sql`EXCLUDED.Agent_Name`,
          retailerNo: sql`EXCLUDED.Retailer_No`,
          retailerName: sql`EXCLUDED.retailer_Name`,
          notifyCustomer: sql`EXCLUDED.Notify_Customer`,
          notifyCustomerName: sql`EXCLUDED.Notify_Customer_Name`,
          salesPersonCode: sql`EXCLUDED.Sales_Person_Code`,
          customerPostingGroup: sql`EXCLUDED.Customer_Posting_Group`,
          status: sql`EXCLUDED.Status`,
          scheme: sql`EXCLUDED.Scheme`,
          salesPoint: sql`EXCLUDED.Sales_Point`,
          quantity: sql`EXCLUDED.Quantity`,
          qualityDesc: sql`EXCLUDED.Quality_Desc`,
          multiplier: sql`EXCLUDED.Multiplier`,
          etag: sql`EXCLUDED.ETag`,
          createdAt:sql`EXCLUDED.Created_DateTime` || sql`CURRENT_TIMESTAMP`
      } });

    console.log(`Inserted ${validRecords.length} records into sales_points_claim_transfer`);
    if (skippedRecords.length > 0) {
      console.log(`Skipped ${skippedRecords.length} records due to missing documentNo`);
    }
  } catch (error) {
    console.error('Error during bulk insert into sales_points_claim_transfer:', error);
    throw error;
  }
}

async bulkInsertNavisionSalespersonList(dataArray) {
  try {
    // Ensure dataArray is an array and not empty
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.log('No data provided for bulk insert into navision_salesperson_list');
      return;
    }

    // Map the array of data objects to the format required for the insert
    const values = dataArray.map(data => ({
      code: data['Code'],
      name: data['Name'],
      address: data['Address'],
      address2: data['Address_2'],
      city: data['City'],
      state: data['State'],
      postCode: data['Post_Code'],
      whatsappMobileNumber: data['Whatsapp_Mobile_Number'],
      etag: data['ETag'],
    }));

    // Perform bulk insert
    await db
      .insert(navisionSalespersonList)
      .values(values)
      .onConflictDoNothing({ target: navisionSalespersonList.whatsappMobileNumber });

    console.log(`Inserted ${dataArray.length} records into navision_salesperson_list`);
  } catch (error) {
    console.error('Error during bulk insert into navision_salesperson_list:', error);
    throw error;
  }
}


// Function to generate a username from the vendor name
 generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').substring(0, 50); // Simple username generation
}

// Function to generate a default password
async  generatePassword(): Promise<string> {
  const saltRounds = 10;
  const defaultPassword = 'defaultPassword123'; // Replace with a secure random password generator if needed
  return bcrypt.hash(defaultPassword, saltRounds);
}

// Main function to onboard distributors
async  onboardDistributors(): Promise<void> {
  try {
    // Fetch vendors where onboarded is false
    const vendors = await db
      .select()
      .from(navisionVendorMaster)
      .where(eq(navisionVendorMaster.onboarded, false));

    if (!vendors.length) {
      console.log('No vendors to onboard.');
      return;
    }

    for (const vendor of vendors) {
      try {
        // Prepare parameters for onboard_distributor
        const username = this.generateUsername(vendor.name || 'vendor_' + vendor.no);
        const password = await this.generatePassword();
        const userType = 'distributor'; // Default user type
        const deviceDetails = {}; // Placeholder; replace with actual data if available
        const exists = await db.select().from(distributor).where(eq(distributor.navisionId,vendor.no))
        if(exists.length){
          await db.update(distributor).set({distributorName: vendor.name, phoneNumber: vendor.whatsappNo, address: vendor.address,}).where(eq(distributor.navisionId,vendor.no));
          await db.update(userMaster).set({username:vendor.name,mobileNumber:vendor.whatsappNo,secondaryMobileNumber:vendor.whatsappMobileNumber}).where(eq(userMaster.userId,exists[0].userId));
        }else if (this.rootFiltercheck(vendor.no)) {
            const result = await pool.query(
          `SELECT * FROM onboard_distributor($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            vendor.name,
            vendor.whatsappNo || vendor.whatsappMobileNumber || null, // Map to mobile_number
            vendor.whatsappMobileNumber || null, // Map to secondary_mobile_number
            password,
            vendor.name || null, // distributor_name
            vendor.name || null, // contact_person (using name as fallback)
            vendor.whatsappNo || null, // phone_number
            null, // email (not available in schema)
            vendor.address || null,
            vendor.city || null,
            vendor.stateCode || null,
            vendor.postCode || null,
            userType,
            null, // fcm_token (not available)
            vendor.no || null, // navision_id
            deviceDetails,
          ]
        );

        const response = result.rows[0];
        await db.insert(onboardingLogs).values({
          refNo:vendor.no,
          result:response
        })
        console.log(response)

        if (response.success) {
          // Update onboarded status and timestamp
          await db
            .update(navisionVendorMaster)
            .set({
              onboarded: true,
              onboardedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(navisionVendorMaster.no, vendor.no));
             console.log(`Successfully onboarded vendor ${vendor.no}: user_id=${response.user_id}, distributor_id=${response.distributor_id}`);
        } else {
          console.error(`Failed to onboard vendor ${vendor.no}: ${response.error}`);
        }
        }
        // Call onboard_distributor function
      

         
      } catch (error) {
        console.error(`Error onboarding vendor ${vendor.no}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching vendors:', error);
  } finally {
    //await pool.end();
  }
}

private BATCH_SIZE = 50;

// Validate OnboardData before calling the procedure
 validateOnboardData(data: OnboardData): boolean {
  if (!data.username || !data.mobile_number || !data.shop_name || !data.user_type || !data.password) {
    console.error(`Validation failed: Missing required fields for ${data.navision_id || 'unknown'}`);
    return false;
  }
  return true;
}

// Generic function to call onboard_retailer procedure
async  callProcedure(client: PoolClient, data: OnboardData): Promise<OnboardResult> {
  if (!this.validateOnboardData(data)) {
     await db.insert(onboardingLogs).values({
            refNo:data.navision_id || 'unknown',
            result:{data:`Invalid data for navision_id ${data.navision_id || 'unknown'}`}
           })
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
      const existing  = await db.select().from(retailer).where(eq(retailer.navisionId,data.navision_id))
      let result;
      if(existing.length){
        result  =await client.query(`SELECT update_retailer($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) AS result`,[
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
          'retailer',
          data.navision_id,
          '',
        ])
      }else{
 result = await client.query<{ result: OnboardResult }>(
      `SELECT onboard_retailer($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) AS result`,
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
        deviceDetailsJson,
        data.home_address
      ]
    );
      }

    
    const onboardResult = result.rows[0]?.result;
    await db.insert(onboardingLogs).values({
      refNo:data.navision_id,
      result:onboardResult
    })
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
async processBatch<T>(
  records: T[],
  mapToOnboardData: (record: T) => OnboardData,
  tableName: string
): Promise<LogEntry[]> {
  const client = await pool.connect();
  const results: LogEntry[] = [];
  try {
    for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
      const batch = records.slice(i, i + this.BATCH_SIZE);
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

        const enttry = await db.select().from(userMaster).where(and(eq(userMaster.mobileNumber,data.mobile_number),eq(userMaster.userType,'retailer')))
        if(enttry.length){
          return null
        }
if (!this.rootFiltercheck(data.navision_id))return null;
        const result = await this.callProcedure(client, data);
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
      console.log(`Processed batch ${i / this.BATCH_SIZE + 1} of ${tableName}`);
    }
  } finally {
    client.release();
  }
  return results;
}

async  onboardAllRetailer() {
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
      shop_address: `${c.address},${c.address2}`,
      home_address: '',
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
      shop_address: `${n.address},${n.address2}`,
      home_address: '',
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
      shop_address: `${r.shopAddress},${r.address2}`,
      home_address: '',
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
      this.processBatch<CustomerMaster>(customers, mapCustomerMaster, 'navisionCustomerMaster'),
      this.processBatch<NotifyCustomer>(notifyCustomers, mapNotifyCustomer, 'navisionNotifyCustomer'),
      this.processBatch<RetailMaster>(retailCustomers, mapRetailMaster, 'navisionRetailMaster'),
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
    //await pool.end();
  }
}


async  mapDist() {
  try {
    // Fetch all navision IDs at once
    const navisionRecords = await db
      .select({ navId: retailer.navisionId })
      .from(retailer);

    if (!navisionRecords.length) {
      console.log('No navision records found');
      return;
    }

    // Extract navision IDs
    const navIds = navisionRecords.map(n => n.navId);

    // Batch fetch navision retail master entries
    const navEntries = await db
      .select()
      .from(navisionRetailMaster)
      .where(
        inArray(navisionRetailMaster.no, navIds,
      ));

    // Create a map for quick lookup
    const navEntryMap = new Map(
      navEntries.map(entry => [entry.no, entry.agentCode])
    );

    // Get unique agent codes
    const agentCodes = [...new Set(navEntries.map(entry => entry.agentCode))];

    // Batch fetch distributor entries
    const distEntries = await db
      .select({ navisionId: distributor.navisionId, distributorId: distributor.distributorId })
      .from(distributor)
      .where(inArray(distributor.navisionId, agentCodes));

    // Create a map for distributor lookup
    const distMap = new Map(
      distEntries.map(entry => [entry.navisionId, entry.distributorId])
    );

    // Prepare batch update operations
    const updateOperations = navisionRecords
      .filter(n => {
        const agentCode = navEntryMap.get(n.navId);
        return agentCode && distMap.get(agentCode);
      })
      .map(n => {
        const agentCode = navEntryMap.get(n.navId);
        return db
          .update(retailer)
          .set({ distributorId: distMap.get(agentCode) })
          .where(eq(retailer.navisionId, n.navId));
      });

    // Execute updates in parallel
    await Promise.all(updateOperations);

    console.log(`Updated ${updateOperations.length} retailer records`);
    return { updatedCount: updateOperations.length };
  } catch (error) {
    console.error('Error in mapDist:', error);
    throw error;
  }
}




async  mapDist2(): Promise<UpdateResult> {
  try {
    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Reset retailer.distributor_id to NULL to avoid stale data
      ///await tx.update(retailer).set({ distributorId: null });

      // Fetch all retailer navision IDs in batches
      const BATCH_SIZE = 1000;
      let offset = 0;
      let allRetailers: { navId: string }[] = [];

      // Get total count for pagination
      const [countResult]: { count: number }[] = await tx
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(retailer)
        .where(isNull(retailer.distributorId))

      const count = countResult.count; // Safe, as COUNT(*) always returns one row

      // Fetch retailers in batches
      while (offset < count) {
        const retailers = await tx
          .select({ navId: retailer.navisionId })
          .from(retailer)
          .where(isNull(retailer.distributorId))
          .limit(BATCH_SIZE)
          .offset(offset);

        allRetailers = allRetailers.concat(retailers);
        offset += BATCH_SIZE;
      }

      // Fetch all distributor navision IDs for validation
      const distributorIds = await tx
        .select({ navisionId: distributor.navisionId })
        .from(distributor)
        
      const validDistributorIds = new Set(
        distributorIds.map((d) => d.navisionId?.trim().toUpperCase() ?? '')
      );

      // Fetch all mappings from Navision tables using UNION ALL, prioritizing navision_retail_master
      const navisionMappings: any[] = await tx
        .select({
          no: sql<string>`"No"`,
          agent: sql<string>`"Agent_Code"`,
          source: sql`'retail'`.as('source'),
        })
        .from(navisionRetailMaster)
        .unionAll(
          tx
            .select({
              no: navisionCustomerMaster.no,
              agent: navisionCustomerMaster.salesAgent,
              source: sql`'customer'`,
            })
            .from(navisionCustomerMaster)
        )
        .unionAll(
          tx
            .select({
              no: navisionNotifyCustomer.no,
              agent: navisionNotifyCustomer.salesAgent,
              source: sql`'notify'`,
            })
            .from(navisionNotifyCustomer)
        );

      // Create map with normalized keys and values
      const navisionMap = new Map<string, NavisionMapping>();
      for (const mapping of navisionMappings) {
        const normalizedNo = mapping.no?.trim().toUpperCase() ?? '';
        // Prioritize retail if multiple mappings exist (shouldn't happen per Query 3)
        if (!navisionMap.has(normalizedNo) || mapping.source === 'retail') {
          navisionMap.set(normalizedNo, {
            no: normalizedNo,
            agent: mapping.agent?.trim().toUpperCase() ?? '',
            source: mapping.source,
          });
        }
      }

      // Process updates and track skipped navIds
      const updatePromises: { navId: string; source: string; promise: Promise<any> }[] = [];
      const skippedNavIds: { navId: string; reason: string; source?: string; agent?: string }[] = [];

      for (const { navId } of allRetailers) {
        const normalizedNavId = navId?.trim().toUpperCase() ?? '';
        const mapping = navisionMap.get(normalizedNavId);

        if (mapping && mapping.agent && validDistributorIds.has(mapping.agent)) {
          const distributorIdQuery = sql`(SELECT distributor_id FROM distributor WHERE navision_id = ${mapping.agent})`;
          const updatePromise = tx
            .update(retailer)
            .set({ distributorId: distributorIdQuery })
            .where(
              and(
                eq(retailer.navisionId, navId),
                sql`EXISTS (SELECT 1 FROM distributor WHERE navision_id = ${mapping.agent})`
              )
            );
          updatePromises.push({ navId, source: mapping.source, promise: updatePromise });
        } else {
          skippedNavIds.push({
            navId,
            reason: !mapping
              ? 'No matching entry in any Navision table'
              : !mapping.agent
              ? 'Empty agent code in Navision table'
              : `No distributor found for agent: ${mapping.agent}`,
            source: mapping?.source,
            agent: mapping?.agent,
          });
        }
      }

      // Execute all updates concurrently
      await Promise.all(updatePromises.map((u) => u.promise));

      // Log results
      console.log(`Successfully updated ${updatePromises.length} retailer distributor IDs`);
      if (skippedNavIds.length > 0) {
        console.warn('Skipped navIds:', JSON.stringify(skippedNavIds, null, 2));
      }

      // Summarize source usage
      const sourceCounts = updatePromises.reduce((acc, u) => {
        acc[u.source] = (acc[u.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Update sources:', sourceCounts);

      return { updatedCount: updatePromises.length, skippedNavIds };
    });

    return result;
  } catch (error) {
    console.error('Error in mapDist2:', error);
    throw new Error(`Failed to update retailers: ${(error as Error).message}`);
  }
}

async mapSalesPerson() {
  try {
    // Fetch all navision IDs from retailer table
    const navisionRecords = await db
      .select({ navId: retailer.navisionId })
      .from(retailer);

    if (!navisionRecords.length) {
      console.log('No navision records found');
      return { updatedCount: 0 };
    }

    // Update retailer table with salesAgentCode from the first matching table
    const updateQuery = await db
      .update(retailer)
      .set({
        salesAgentCodee: sql`
          COALESCE(
            (SELECT ${navisionRetailMaster.salesPersonCode} 
             FROM ${navisionRetailMaster} 
             WHERE ${navisionRetailMaster.no} = ${retailer.navisionId}),
            (SELECT ${navisionCustomerMaster.salespersonCode} 
             FROM ${navisionCustomerMaster} 
             WHERE ${navisionCustomerMaster.no} = ${retailer.navisionId}),
            (SELECT ${navisionNotifyCustomer.salesPerson} 
             FROM ${navisionNotifyCustomer} 
             WHERE ${navisionNotifyCustomer.no} = ${retailer.navisionId}),
            NULL
          )
        `,
      })
      .where(inArray(retailer.navisionId, navisionRecords.map(n => n.navId)))
      .returning({ updatedId: retailer.navisionId });

    console.log(`Updated ${updateQuery.length} retailer records with salesAgentCode`);
    return { updatedCount: updateQuery.length };
  } catch (error) {
    console.error('Error in mapDist:', error);
    throw error;
  }
}

async test(){

  const distirbutors = await db.select({navId:distributor.navisionId,userId:distributor.userId}).from(distributor)

  for await (const d of distirbutors){
   
     const query1 = db
    .select({
      total_points: sql<number>`SUM(${salesPointLedgerEntry.salesPoints})`.as('total_points'),
    })
    .from(salesPointLedgerEntry)
    .where(
      and(
        eq(salesPointLedgerEntry.documentType, 'Transfer'),
        eq(salesPointLedgerEntry.agentCode, d.navId),
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        eq(salesPointLedgerEntry.customerIsAgent, false),
        ne(salesPointLedgerEntry.retailerNo, '')
      )
    );

  // Second subquery: customer_no is not empty, retailer_no is empty, notify_customer_no is empty, quantity > 0
  const query2 = db
    .select({
      total_points: sql<number>`SUM(${salesPointLedgerEntry.salesPoints})`.as('total_points'),
    })
    .from(salesPointLedgerEntry)
    .where(
      and(
        eq(salesPointLedgerEntry.documentType, 'Transfer'),
        eq(salesPointLedgerEntry.agentCode, d.navId),
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        eq(salesPointLedgerEntry.customerIsAgent, false),
        ne(salesPointLedgerEntry.customerNo, ''),
        eq(salesPointLedgerEntry.retailerNo, ''),
        eq(salesPointLedgerEntry.notifyCustomerNo, ''),
        sql`${salesPointLedgerEntry.quantity} > 0`
      )
    );

  // Third subquery: customer_no is empty, retailer_no is empty, notify_customer_no is not empty, quantity > 0
  const query3 = db
    .select({
      total_points: sql<number>`SUM(${salesPointLedgerEntry.salesPoints})`.as('total_points'),
    })
    .from(salesPointLedgerEntry)
    .where(
      and(
        eq(salesPointLedgerEntry.documentType, 'Transfer'),
        eq(salesPointLedgerEntry.agentCode, d.navId),
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        eq(salesPointLedgerEntry.customerIsAgent, false),
        eq(salesPointLedgerEntry.customerNo, ''),
        eq(salesPointLedgerEntry.retailerNo, ''),
        ne(salesPointLedgerEntry.notifyCustomerNo, ''),
        sql`${salesPointLedgerEntry.quantity} > 0`
      )
    );

  // Execute all queries
  const [result1, result2, result3] = await Promise.all([query1, query2, query3]);

  // Extract total_points from each result, defaulting to 0 if null
  const total1 = result1[0]?.total_points ?? 0;
  const total2 = result2[0]?.total_points ?? 0;
  const total3 = result3[0]?.total_points ?? 0;

  // Sum the results
  const total_transferred = Number(total1) + Number(total2) + Number(total3);
const subquery = db
    .select({ document_no: salesPointsClaimTransfer.documentNo })
    .from(salesPointsClaimTransfer)
    .where(
      and(
        eq(salesPointsClaimTransfer.agentCode, d.navId),
        eq(salesPointsClaimTransfer.scheme, GlobalState.schemeFilter),
        eq(salesPointsClaimTransfer.entryType, 'Points Transfer'),
        eq(salesPointsClaimTransfer.status, 'Submitted'),
        eq(salesPointsClaimTransfer.lineType, 'Header')
      )
    );

  // Main query: Sum sales_point where document_no is in subquery results
  const result = await db
    .select({
      total_points: sql<number>`COALESCE(SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS NUMERIC)), 0)`.as('total_points'),
    })
    .from(salesPointsClaimTransfer)
    .where(
      and(
        eq(salesPointsClaimTransfer.agentCode, d.navId),
        eq(salesPointsClaimTransfer.scheme, GlobalState.schemeFilter),
        eq(salesPointsClaimTransfer.entryType, 'Points Transfer'),
        eq(salesPointsClaimTransfer.status, 'Submitted'),
        inArray(salesPointsClaimTransfer.documentNo, subquery)
      )
    );

  // Extract total_points from the result
  const total_submitted = result[0]?.total_points ?? 0;


   const agentResult = await db
    .select({
      total_agent: sql<number>`COALESCE(SUM(${salesPointLedgerEntry.salesPoints}), 0)`.as('total_agent'),
    })
    .from(salesPointLedgerEntry)
    .where(
      and(
        eq(salesPointLedgerEntry.documentType, 'Invoice'),
        eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter),
        eq(salesPointLedgerEntry.agentCode, d.navId),
        eq(salesPointLedgerEntry.customerIsAgent, true)
      )
    );

  // Extract total_agent from the result
  const total_agent = agentResult[0]?.total_agent ?? 0;

  const total_available = total_agent - total_transferred - total_submitted
console.log(d.navId,total_available)
  await db.update(distributor).set({balancePoints:(total_available.toFixed(2))}).where(eq(distributor.navisionId,d.navId))
  await db.update(userMaster).set({balancePoints:String(total_available)}).where(eq(userMaster.userId,d.userId))

}
}
async distributorPoints() {
  try {

await db.execute(sql `
UPDATE distributor
  SET total_points = COALESCE((
    SELECT SUM(spl.sales_points)
    FROM public.sales_point_ledger_entry spl
    WHERE spl.agent_code = distributor.navision_id
      AND spl.document_type = 'Invoice'
      AND spl.scheme = ${GlobalState.schemeFilter}
  ), 0)
          `)

   await this.test()
await db
      .update(distributor)
      .set({
        consumedPoints: sql`${distributor.totalPoints} - ${distributor.balancePoints}`,
      }) 
await db.execute(sql`
      UPDATE user_master
      SET total_points = distributor.total_points,
          balance_points = distributor.balance_points,
          redeemed_points = distributor.consumed_points
      FROM distributor
      WHERE user_master.user_id = distributor.user_id
    `);
  } catch (error) {
    console.error('Error fetching distributors:', error);
    throw new Error(`Failed to fetch distributors: ${error.message}`);
  }
}

async totalPoints() {

  const INVOICE_SCHEME = 'SCHEME 1'
   const TRANSFER_CLAIM = 'SCHEME 1'
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
          isNotNull(salesPointLedgerEntry.retailerNo),
          eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter)
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
          isNotNull(salesPointLedgerEntry.customerNo),
          eq(salesPointLedgerEntry.scheme, GlobalState.schemeFilter)
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
          isNotNull(salesPointLedgerEntry.notifyCustomerNo),
          eq(salesPointLedgerEntry.scheme,GlobalState.schemeFilter )
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

async claimPoints() {
  try {
    // Step 1: Aggregate points from sales_point_ledger_entry and sales_points_claim_transfer
    console.log('Fetching merged points...');
    const mergedPointsQuery = await db
      .select({
        id: sql`navision_id`.as('id'),
        totalPoints: sql`ABS(SUM(total_points))`.as('totalPoints'),
      })
      .from(
        sql`(SELECT navision_id, SUM(total_points) AS total_points
             FROM (
               -- Aggregate from sales_point_ledger_entry
               SELECT ${salesPointLedgerEntry.retailerNo} AS navision_id, 
                      ABS(SUM(${salesPointLedgerEntry.salesPoints})) AS total_points
               FROM ${salesPointLedgerEntry}
               WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
               AND ${salesPointLedgerEntry.scheme} = ${GlobalState.schemeFilter}
                 AND ${salesPointLedgerEntry.retailerNo} IS NOT NULL
               GROUP BY ${salesPointLedgerEntry.retailerNo}
               UNION ALL
               SELECT ${salesPointLedgerEntry.customerNo} AS navision_id, 
                      ABS(SUM(${salesPointLedgerEntry.salesPoints})) AS total_points
               FROM ${salesPointLedgerEntry}
               WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
                 AND ${salesPointLedgerEntry.customerNo} IS NOT NULL
                    AND ${salesPointLedgerEntry.scheme} = ${GlobalState.schemeFilter}

               GROUP BY ${salesPointLedgerEntry.customerNo}
               UNION ALL
               SELECT ${salesPointLedgerEntry.notifyCustomerNo} AS navision_id, 
                     ABS(SUM(${salesPointLedgerEntry.salesPoints})) AS total_points
               FROM ${salesPointLedgerEntry}
               WHERE ${salesPointLedgerEntry.documentType} = 'Claim'
                  AND ${salesPointLedgerEntry.scheme} = ${GlobalState.schemeFilter}
                 AND ${salesPointLedgerEntry.notifyCustomerNo} IS NOT NULL
               GROUP BY ${salesPointLedgerEntry.notifyCustomerNo}
               UNION ALL
               -- Aggregate from sales_points_claim_transfer
               SELECT ${salesPointsClaimTransfer.retailerNo} AS navision_id, 
                      SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
               FROM ${salesPointsClaimTransfer}
               WHERE ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
                 AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                 AND ${salesPointsClaimTransfer.status} = 'Submitted'
                 AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 AND ${salesPointsClaimTransfer.documentNo} IN (
                   SELECT ${salesPointsClaimTransfer.documentNo}
                   FROM ${salesPointsClaimTransfer}
                   WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                     AND ${salesPointsClaimTransfer.status} = 'Submitted'
                     AND ${salesPointsClaimTransfer.lineType} = 'Header'
                     AND ${salesPointsClaimTransfer.retailerNo} IS NOT NULL
                     AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 )
               GROUP BY ${salesPointsClaimTransfer.retailerNo}
               UNION ALL
               SELECT ${salesPointsClaimTransfer.customerNo} AS navision_id, 
                      SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
               FROM ${salesPointsClaimTransfer}
               WHERE ${salesPointsClaimTransfer.customerNo} IS NOT NULL
                 AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                 AND ${salesPointsClaimTransfer.status} = 'Submitted'
                 AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 AND ${salesPointsClaimTransfer.documentNo} IN (
                   SELECT ${salesPointsClaimTransfer.documentNo}
                   FROM ${salesPointsClaimTransfer}
                   WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                     AND ${salesPointsClaimTransfer.status} = 'Submitted'
                     AND ${salesPointsClaimTransfer.lineType} = 'Header'
                     AND ${salesPointsClaimTransfer.customerNo} IS NOT NULL
                     AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 )
               GROUP BY ${salesPointsClaimTransfer.customerNo}
               UNION ALL
               SELECT ${salesPointsClaimTransfer.notifyCustomer} AS navision_id, 
                      SUM(CAST(${salesPointsClaimTransfer.salesPoint} AS INTEGER)) AS total_points
               FROM ${salesPointsClaimTransfer}
               WHERE ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
                 AND ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                 AND ${salesPointsClaimTransfer.status} = 'Submitted'
                 AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 AND ${salesPointsClaimTransfer.documentNo} IN (
                   SELECT ${salesPointsClaimTransfer.documentNo}
                   FROM ${salesPointsClaimTransfer}
                   WHERE ${salesPointsClaimTransfer.entryType} = 'Points Claim'
                     AND ${salesPointsClaimTransfer.status} = 'Submitted'
                     AND ${salesPointsClaimTransfer.lineType} = 'Header'
                     AND ${salesPointsClaimTransfer.notifyCustomer} IS NOT NULL
                     AND ${salesPointsClaimTransfer.scheme} = ${GlobalState.schemeFilter}
                 )
               GROUP BY ${salesPointsClaimTransfer.notifyCustomer}
             ) AS points
             GROUP BY navision_id) AS combined`
      )
      .groupBy(sql`navision_id`);

    const mergedPoints = mergedPointsQuery as unknown as MergedPoint[];
    console.log('Merged points:', JSON.stringify(mergedPoints, null, 2));
    if (!mergedPoints || mergedPoints.length === 0) {
      console.warn('No merged points found. Check source data in sales_point_ledger_entry or sales_points_claim_transfer.');
      return { mergedPoints: [] };
    }

    // Step 2: Validate navision_id against retailer table
    console.log('Checking navision_id matches in retailer table...');
    const retailerIds = await db
      .select({ navisionId: retailer.navisionId })
      .from(retailer);
    const navisionIds = mergedPoints.map(p => p.id);
    const matchingIds = retailerIds.filter(r => navisionIds.includes(r.navisionId));
    console.log('Matching navisionIds:', matchingIds.map(r => r.navisionId));
    if (matchingIds.length === 0) {
      console.warn('No matching navisionIds found. Retailer update will not occur.');
    }

    // Step 3: Update retailer.consumedPoints for each navision_id
    console.log('Updating retailer consumedPoints...');
    let totalRowsAffected = 0;
    for (const point of mergedPoints) {
      const updateResult = await db
        .update(retailer)
        .set({
          consumedPoints: String(point.totalPoints),
        })
        .where(eq(retailer.navisionId, point.id))
        .execute();
      totalRowsAffected += updateResult.rowCount || 0;
    }

    console.log('Retailer update rows affected:', totalRowsAffected);
    if (totalRowsAffected === 0) {
      console.warn('No retailers updated. Check navision_id matches and data in source tables.');
    }

    // Step 4: Validate userId mappings between retailer and user_master
    console.log('Checking userId mappings...');
    const retailerUserIds = await db
      .select({ userId: retailer.userId, navisionId: retailer.navisionId })
      .from(retailer);
    const userMasterIds = await db
      .select({ userId: userMaster.userId })
      .from(userMaster);
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
      )
      .execute();

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

async balancePoints() {
  try {

await db.update(retailer).set({balancePoints: sql`(SELECT ${retailer.totalPoints} - ${retailer.consumedPoints})`});
await db.update(userMaster).set({balancePoints: sql`(SELECT ${userMaster.totalPoints} - ${userMaster.redeemedPoints})`});

  } catch (error) {
    console.error('Error balancing points:', error);
    throw new Error(`Failed to balance points: ${error.message}`);
  }
}

async onboardSalesPerson(){
    try {
         const sales = await db.select().from(navisionSalespersonList).where(eq(navisionSalespersonList.onboarded,false))
    for await (let s of sales){
      if (this.rootFiltercheck(s.code)) {
        await db.transaction(async (tx)=>{
            const existingUser = await tx.select().from(userMaster).where(and(eq(userMaster.mobileNumber,s.whatsappMobileNumber),eq(userMaster.userType,'sales'))).limit(1);
            if (existingUser.length > 0) {
              await db.insert(onboardingLogs).values({
            refNo:s.code,
            result:{data:`User with mobile number ${s.whatsappMobileNumber} already exists, skipping onboarding.`}
           })
                console.log(`User with mobile number ${s.whatsappMobileNumber} already exists, skipping onboarding.`);
                return; // Skip if user already exists
            }
           const entry =  await tx.insert(userMaster).values({mobileNumber:s.whatsappMobileNumber,userType:'sales',roleId:3,username:s.name}).returning()
           await db.insert(onboardingLogs).values({
            refNo:s.code,
            result:{data:`Onboarded user: ${entry} with mobile number ${s.whatsappMobileNumber}`}
           })
           console.log(`Onboarded user: ${entry} with mobile number ${s.whatsappMobileNumber}`);
            await tx.insert(salesperson).values({userId:entry[0].userId,salespersonName:s.name,state:s.state,pinCode:s.postCode,mobileNumber:s.whatsappMobileNumber,address:s.address,address2:s.address2,city:s.city,navisionId:s.code}).onConflictDoNothing({target:salesperson.userId})
            await db.update(navisionSalespersonList).set({onboarded:true}).where(eq(navisionSalespersonList.code,s.code))
        })
    }
  }
    } catch (error) {
      
        console.log(error)
    }
   
}
async  syncRedemptionRequest() {
  try {
    const query = sql`
      INSERT INTO redemption_request (
        redemption_id,
        user_id,
        distributor_id,
        method,
        points_redeemed,
        points_value,
        monetary_value,
        request_date,
        status,
        payment_cleared,
        fulfillment_details,
        created_at,
        updated_at,
        delivery_address,
        quantity,
        reward,
        reward_id,
        navision_id,
        retailer_code,
        distributor_code,
        document_no
      )
      SELECT 
        CONCAT('RED-', r.document_no) AS redemption_id,
        COALESCE(
          (SELECT um.user_id FROM retailer um WHERE um.navision_id = NULLIF(s.retailer_no, '') LIMIT 1),
          (SELECT um.user_id FROM retailer um WHERE um.navision_id = NULLIF(s.customer_no, '') LIMIT 1),
          (SELECT um.user_id FROM retailer um WHERE um.navision_id = NULLIF(s.notify_customer_no, '') LIMIT 1)
        ) AS user_id,
        (SELECT d.distributor_id FROM distributor d WHERE d.navision_id = s.agent_code LIMIT 1) AS distributor_id,
        s.document_type AS method,
        ABS(s.sales_points) AS points_redeemed,
        ABS(s.sales_points) AS points_value,
        NULL AS monetary_value, -- Provide a value for monetary_value
        r.entry_date AS request_date,
        COALESCE(r.status, 'pending') AS status,
        FALSE AS payment_cleared,
        r.courier_name AS fulfillment_details,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at,
        NULL AS delivery_address,
        r.qty AS quantity,
        r.gift_article_name AS reward,
        NULL AS reward_id,
        r.entry_no AS navision_id,
        COALESCE(NULLIF(s.retailer_no, ''), NULLIF(s.customer_no, ''), NULLIF(s.notify_customer_no, '')) AS retailer_code,
        s.agent_code AS distributor_code,
        r.document_no AS document_no
      FROM 
        retailer_reward_point_entry r
      INNER JOIN 
        sales_point_ledger_entry s
      ON 
        r.document_no = s.document_no
      ON CONFLICT ON CONSTRAINT entry_no_navision_id
      DO NOTHING
      RETURNING *;
    `;

    const result = await db.execute(query);
    console.log('Inserted Records:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error piping data to redemption_request:', error);
    throw error;
  } finally {
    //await pool.end(); // Close the database connection
  }
}


async postClaimTransfer(payload: ClaimPostPayload): Promise<void> {
  const url = `${process.env.NAVISION_URL}/SalesPointTransfer_ClaimPostAPIList`;

 

  try {
      const response = await this.makeRequest(url, 'POST',payload);
    console.log('✅ Success:', response);
  await db.insert(apiResponseLogs).values({
      refNo:payload.Document_No,
      apiUrl: url,
      apiResponse: response,
      payload:payload
    })
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    await db.insert(apiResponseLogs).values({
      refNo:payload.Document_No,
      apiUrl: url,
      apiResponse: error.response?.data || error.message,
      payload:payload
    })
    throw new Error(error.response?.data || error.message)

    
  }
}



// async pushledgerToNavision() {
//   try {
//     return
//     // Fetch all records from sales_point_ledger_entry
//     const records = await db.select().from(salesPointLedgerEntry);

//     if (records.length === 0) {
//       console.log('No records found in sales_point_ledger_entry');
//       return;
//     }

//     // Map records to the format required for Navision
//     const values = records.map(record => ({
//       documentNo: record.documentNo,
//       documentType: record.documentType,
//       entryType: record.entryType,
//       lineType: record.lineType,
//       retailerNo: record.retailerNo,
//       customerNo: record.customerNo,
//       notifyCustomerNo: record.notifyCustomerNo,
//       salesPoints: record.salesPoints,
//       entryDate: record.entryDate,
//       agentCode: record.agentCode,
//       scheme: record.scheme,
//     }));

//     // Perform bulk insert into Navision table
//     await db.insert(navisionSalesPointLedgerEntry).values(values).onConflictDoNothing();

//     console.log(`Inserted ${values.length} records into navision_sales_point_ledger_entry`);
//   } catch (error) {
//     console.error('Error during bulk insert into navision_sales_point_ledger_entry:', error);
//     throw error;
//   }
// }
}

export default NavisionService;
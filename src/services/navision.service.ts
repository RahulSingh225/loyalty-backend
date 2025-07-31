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
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/SalesPointsLedgerEntries_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertSalesPointLedgerEntry(result.value);
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
        const pageSize = 1000;
        let skip = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const url = `${process.env.NAVISION_URL}/SalesPointClaim_Transfer_LoyaltyApp?$top=${pageSize}&$skip=${skip}`;
            const result = await this.makeRequest(url, 'GET');
            await this.bulkInsertSalesPointsClaimTransfer(result.value);
            hasMoreData = result.value && result.value.length === pageSize;
            skip += pageSize;
            console.log('Total records inserted', skip);
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
      .onConflictDoNothing({ target: salesPointLedgerEntry.entryNo });

    console.log(`Inserted ${validRecords.length} records into sales_point_ledger_entry`);
    if (skippedRecords.length > 0) {
      console.log(`Skipped ${skippedRecords.length} records due to missing documentNo`);
    }
  } catch (error) {
    console.error('Error during bulk insert into sales_point_ledger_entry:', error);
    throw error;
  }
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
      .onConflictDoNothing({ target: salesPointsClaimTransfer.docLineNo });

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

        // Call onboard_distributor function
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
      if(existing){
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
          data.home_address
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

        const enttry = await db.select().from(userMaster).where(eq(userMaster.mobileNumber,data.mobile_number))
        if(enttry.length){
          return null
        }

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

   await db.execute(sql`
    WITH earned_points AS (
  SELECT agent_code, COALESCE(SUM(sales_points), 0) AS total_earned
  FROM public.sales_point_ledger_entry
  WHERE document_type = 'Invoice'
    AND scheme = ${GlobalState.schemeFilter}
    AND customer_is_agent = true
  GROUP BY agent_code
),
transferred_points AS (
  SELECT agent_code, COALESCE(SUM(total_points), 0) AS total_transferred
  FROM (
    SELECT agent_code, SUM(sales_points) AS total_points
    FROM public.sales_point_ledger_entry
    WHERE document_type = 'Transfer'
      AND scheme = ${GlobalState.schemeFilter}
      AND customer_is_agent = false
      AND retailer_no <> ''
    GROUP BY agent_code
    UNION ALL
    SELECT agent_code, SUM(sales_points) AS total_points
    FROM public.sales_point_ledger_entry
    WHERE document_type = 'Transfer'
      AND scheme = ${GlobalState.schemeFilter}
      AND customer_is_agent = false
      AND customer_no <> ''
      AND retailer_no = ''
      AND notify_customer_no = ''
      AND quantity > 0
    GROUP BY agent_code
    UNION ALL
    SELECT agent_code, SUM(sales_points) AS total_points
    FROM public.sales_point_ledger_entry
    WHERE document_type = 'Transfer'
      AND scheme = ${GlobalState.schemeFilter}
      AND customer_is_agent = false
      AND customer_no = ''
      AND retailer_no = ''
      AND notify_customer_no <> ''
      AND quantity > 0
    GROUP BY agent_code
    UNION ALL
    SELECT agent_code, SUM(CAST(sales_point AS INTEGER)) AS total_points
    FROM public.sales_points_claim_transfer
    WHERE scheme = ${GlobalState.schemeFilter}
      AND entry_type = 'Points Transfer'
      AND status = 'Submitted'
      AND line_type = 'Header'
    GROUP BY agent_code
  ) AS combined_points
  GROUP BY agent_code
)
UPDATE distributor d
SET balance_points = COALESCE((
  SELECT ep.total_earned
  FROM earned_points ep
  WHERE ep.agent_code = d.navision_id
), 0) - COALESCE((
  SELECT tp.total_transferred
  FROM transferred_points tp
  WHERE tp.agent_code = d.navision_id
), 0);
  `);
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
          eq(salesPointLedgerEntry.scheme, INVOICE_SCHEME)
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
          eq(salesPointLedgerEntry.scheme, INVOICE_SCHEME)
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
          eq(salesPointLedgerEntry.scheme,INVOICE_SCHEME )
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
        await db.transaction(async (tx)=>{
            const existingUser = await tx.select().from(userMaster).where(eq(userMaster.mobileNumber,s.whatsappMobileNumber)).limit(1);
            if (existingUser.length > 0) {
              await db.insert(onboardingLogs).values({
            refNo:s.code,
            result:{data:`User with mobile number ${s.whatsappMobileNumber} already exists, skipping onboarding.`}
           })
                console.log(`User with mobile number ${s.whatsappMobileNumber} already exists, skipping onboarding.`);
                return; // Skip if user already exists
            }
           const entry =  await tx.insert(userMaster).values({mobileNumber:s.whatsappMobileNumber,userType:'sales',roleId:3,username:s.name}).onConflictDoNothing({ target: userMaster.mobileNumber }).returning()
           await db.insert(onboardingLogs).values({
            refNo:s.code,
            result:{data:`Onboarded user: ${entry} with mobile number ${s.whatsappMobileNumber}`}
           })
           console.log(`Onboarded user: ${entry} with mobile number ${s.whatsappMobileNumber}`);
            await tx.insert(salesperson).values({userId:entry[0].userId,salespersonName:s.name,state:s.state,pinCode:s.postCode,mobileNumber:s.whatsappMobileNumber,address:s.address,address2:s.address2,city:s.city,navisionId:s.code}).onConflictDoNothing({target:salesperson.userId})
            await db.update(navisionSalespersonList).set({onboarded:true}).where(eq(navisionSalespersonList.code,s.code))
        })
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
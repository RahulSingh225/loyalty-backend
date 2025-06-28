import axios from 'axios';
import { navisionCustomerMaster, navisionVendorMaster, navisionRetailMaster, navisionNotifyCustomer, salesPointLedgerEntry, salesPointsClaimTransfer, navisionSalespersonList } from '../db/schema';
import { db } from './db.service';
import dotenv from 'dotenv';
import {  sql } from 'drizzle-orm';
    type VendorInsert = typeof navisionVendorMaster.$inferInsert;
    type RetailerInsert = typeof navisionRetailMaster.$inferInsert;
    type CustomerInsert = typeof navisionCustomerMaster.$inferInsert;

class NavisionService {
  
  constructor() {

    dotenv.config(); // Ensure dotenv is configured to load environment variables
  }
   hasKey(object, key) {
    return object?.[key] !== undefined;
}

  generateBasicAuth(username: string, password: string): string {
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
    // Make initial API request
    const result = await this.makeRequest(`${process.env.NAVISION_URL}/CustomerList_LoyaltyAppAPI`, 'GET');
    
    // Process initial batch of customer data
    await this.bulkInsertCustomers(result.value);

    // Check for pagination
    if (this.hasKey(result, 'odata.nextLink')) {
      let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertCustomers(secondaryResult.value);
      }
    }


   
  } catch (error: any) {
      console.error('Error syncing customer:', error);
      throw new Error('Failed to sync customer data with Navision');
    }
  }

  async syncRetail() {
    try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/RetailList_LoyaltyApp`, 'GET');
            
      await this.bulkInsertRetailers(result.value);
      if(this.hasKey(result,'odata.nextLink')){
        let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertRetailers(secondaryResult.value);
      }
      }
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
    }
  }

  async syncSalesLedger() {
try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/SalesPointsLedgerEntries_LoyaltyApp`, 'GET');
            
      await this.bulkInsertSalesPointLedgerEntry(result.value);
      if(this.hasKey(result,'odata.nextLink')){
        let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertSalesPointLedgerEntry(secondaryResult.value);
      }
      }
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
    }
    }

  async syncNotifyCustomer() {
     try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/NotifyCustomerList_LoyaltyApp`, 'GET');
            
      await this.bulkInsertNavisionNotifyCustomer(result.value);
      if(this.hasKey(result,'odata.nextLink')){
        let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertNavisionNotifyCustomer(secondaryResult.value);
      }
      }
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
    }
  
  }

  async syncSalesClaimTransfer() {
    try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/SalesPointClaim_Transfer_LoyaltyApp`, 'GET');
            
      await this.bulkInsertSalesPointsClaimTransfer(result.value);
      if(this.hasKey(result,'odata.nextLink')){
        let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertSalesPointsClaimTransfer(secondaryResult.value);
      }
      }
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
    }
  }

  async syncSalesPersonList(){
 try {
      const result = await this.makeRequest(`${process.env.NAVISION_URL}/SalespersonList_LoyaltyApp`, 'GET');
            
      await this.bulkInsertNavisionSalespersonList(result.value);
      if(this.hasKey(result,'odata.nextLink')){
        let secondaryResult = result; // Use let instead of var for block scope
      while (this.hasKey(secondaryResult, 'odata.nextLink')) {
        // Fetch next page
        secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
        // Process next batch of customer data
        await this.bulkInsertNavisionSalespersonList(secondaryResult.value);
      }
      }
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
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
      .onConflictDoNothing({ target: navisionCustomerMaster.no })
      .returning();

    const insertedCount = result.length;
    const skippedCount = customers.length - insertedCount - validationErrors.length;
    console.log(`Inserted ${insertedCount} customers successfully, skipped ${skippedCount} duplicates, ${validationErrors.length} invalid records`);

    return result;
  } catch (error) {
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
      .onConflictDoNothing({ target: navisionVendorMaster.no }) // Skip duplicates based on primary key
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
    console.log('Sample retailer data:', JSON.stringify(retailers[0], null, 2));

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
      .onConflictDoNothing({ target: navisionRetailMaster.no })
      .returning();

    const insertedCount = result.length;
    const skippedCount = retailers.length - insertedCount - validationErrors.length;
    console.log(`Inserted ${insertedCount} retailers successfully, skipped ${skippedCount} duplicates, ${validationErrors.length} invalid records`);

    return result;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error inserting retailers:', {
      message: error.message,
      code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
      detail: error.detail, // Detailed error message from PostgreSQL
      stack: error.stack,
      retailersSample: retailers.slice(0, 2), // Log first two records for inspection
      query: error.query || 'N/A', // Log the failed query if available
    });
    throw new Error(`Error inserting retailers: ${error.message}`);
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
      .onConflictDoNothing({ target: navisionNotifyCustomer.no });

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
      .onConflictDoNothing({ target: salesPointsClaimTransfer.lineNo });

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

}

export default NavisionService;
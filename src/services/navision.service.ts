// import axios from 'axios';
// import { navisionCustomerMaster, navisionVendorMaster, navisionRetailMaster } from '../db/schema';
// import { db } from './db.service';
// import dotenv from 'dotenv';
// import {  sql } from 'drizzle-orm';
//     type VendorInsert = typeof navisionVendorMaster.$inferInsert;
//     type RetailerInsert = typeof navisionRetailMaster.$inferInsert;
//     type CustomerInsert = typeof navisionCustomerMaster.$inferInsert;

// class NavisionService {
  
//   constructor() {

//     dotenv.config(); // Ensure dotenv is configured to load environment variables
//   }
//    hasKey(object, key) {
//     return object?.[key] !== undefined;
// }

//   generateBasicAuth(username: string, password: string): string {
//     try {
//       // Combine username and password with a colon
//       const credentials = `${username}:${password}`;
//       // Encode to Base64 (using Buffer for Node.js)
//       const base64Credentials = Buffer.from(credentials).toString('base64');
//       // Return the Basic Authorization header value
//       return `Basic ${base64Credentials}`;
//     } catch (error: any) {
//       //console.error('Error generating Basic Authorization:', error.message);
//       throw error;
//     }
//   }

//   async makeRequest(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH', data: any = null) {
//     try {
//       const config = {
//         method: method.toUpperCase(),
//         url: url,
//         headers: {
//           'Accept': 'application/json',
//           'Authorization': this.generateBasicAuth(
//             process.env.NAVISION_USERNAME || '',
//             process.env.NAVISION_PASSWORD || ''
//           ),
//         },
//         data: null as any,
//       };
      

//       if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
//         config.data = data;
//       }

//       const response = await axios(config);
//       return response.data;
//     } catch (error: any) {
//       console.error(`Error in ${method} request to ${url}:`, error.message);
//       throw error;
//     }
//   }

//   async syncVendor() {
//     try {
//       const result = await this.makeRequest(`${process.env.NAVISION_URL}/VendorList_LoyaltyApp`, 'GET');
//       console.log(result)
//       return
//       await this.bulkInsertVendors(result.value);
//     } catch (error: any) {
//       //console.error('Error syncing vendor:', error);
//       throw new Error('Failed to sync vendor data with Navision');
//     }
//   }

//   async syncCustomer() {
//     try {
//     // Make initial API request
//     const result = await this.makeRequest(`${process.env.NAVISION_URL}/CustomerList_LoyaltyAppAPI`, 'GET');
    
//     // Process initial batch of customer data
//     await this.bulkInsertCustomers(result.value);

//     // Check for pagination
//     if (this.hasKey(result, 'odata.nextLink')) {
//       let secondaryResult = result; // Use let instead of var for block scope
//       while (this.hasKey(secondaryResult, 'odata.nextLink')) {
//         // Fetch next page
//         secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
//         // Process next batch of customer data
//         await this.bulkInsertCustomers(secondaryResult.value);
//       }
//     }


   
//   } catch (error: any) {
//       console.error('Error syncing customer:', error);
//       throw new Error('Failed to sync customer data with Navision');
//     }
//   }

//   async syncRetail() {
//     try {
//       const result = await this.makeRequest(`${process.env.NAVISION_URL}/RetailList_LoyaltyApp`, 'GET');
            
//       await this.bulkInsertRetailers(result.value);
//       if(this.hasKey(result,'odata.nextLink')){
//         let secondaryResult = result; // Use let instead of var for block scope
//       while (this.hasKey(secondaryResult, 'odata.nextLink')) {
//         // Fetch next page
//         secondaryResult = await this.makeRequest(secondaryResult['odata.nextLink'], 'GET');
//         // Process next batch of customer data
//         await this.bulkInsertRetailers(secondaryResult.value);
//       }
//       }
//     } catch (error: any) {
//       console.error('Error syncing retail:', error);
//       throw new Error('Failed to sync retail data with Navision');
//     }
//   }

//   async syncSalesInvoice(params: any) {
//     // Logic to sync sales invoice data with Navision
//   }

//   async syncNotifyCustomer(params: any) {
//     // Logic to notify customer about the sync status
//   }

//   async syncSalesPerson(params: any) {
//     // Logic to sync sales person data with Navision
//   }

//   async  bulkInsertCustomers(customers: any[]) {
//   try {
//     if (!customers.length) {
//       console.log('No customers to insert');
//       return [];
//     }

//     // Log the first customer for debugging
//     console.log('Sample customer data:', JSON.stringify(customers[0], null, 2));

//     // Transform and validate input data to match schema
//     const customersWithSchemaFields = customers.map((customer, index) => {
//       const transformedCustomer: CustomerInsert = {
//         no: customer.No || customer.no, // Handle both 'No' and 'no'
//         name: customer.Name || customer.name || null,
//         address: customer.Address || customer.address || null,
//         address2: customer.Address_2 || customer.address2 || null,
//         city: customer.City || customer.city || null,
//         postCode: customer.Post_Code || customer.postCode || null,
//         stateCode: customer.State_Code || customer.stateCode || null,
//         countryRegionCode: customer.Country_Region_Code || customer.countryRegionCode || null,
//         whatsappNo1: customer.Whatsapp_No_1 || customer.whatsappNo1 || null,
//         whatsappNo2: customer.Whatsapp_No_2 || customer.whatsappNo2 || null,
//         pANNo: customer.P_A_N_No || customer.pANNo || null,
//         gstRegistrationNo: customer.GST_Registration_No || customer.gstRegistrationNo || null,
//         salesAgent: customer.Sales_Agent || customer.salesAgent || null,
//         salesAgentName: customer.Sales_Agent_Name || customer.salesAgentName || null,
//         salespersonCode: customer.Salesperson_Code || customer.salespersonCode || null,
//         etag: customer.ETag || customer.etag || null,
//         createdAt: customer.CreatedAt || customer.createdAt || sql`CURRENT_TIMESTAMP`, // Use database default
//         onboarded: customer.Onboarded ?? customer.onboarded ?? false, // Use schema default
//         onboardedAt: customer.OnboardedAt || customer.onboardedAt || null,
//       };

//       // Validate required fields and length constraints
//       if (!transformedCustomer.no) {
//         throw new Error(
//           `Invalid customer data: Missing required field 'no' at index ${index}: ${JSON.stringify(customer)}`
//         );
//       }
//       if (transformedCustomer.no.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'no' exceeds 20 characters at index ${index}: ${transformedCustomer.no}`
//         );
//       }
//       if (transformedCustomer.name && transformedCustomer.name.length > 100) {
//         throw new Error(
//           `Invalid customer data: 'name' exceeds 100 characters at index ${index}: ${transformedCustomer.name}`
//         );
//       }
//       if (transformedCustomer.address && transformedCustomer.address.length > 100) {
//         throw new Error(
//           `Invalid customer data: 'address' exceeds 100 characters at index ${index}: ${transformedCustomer.address}`
//         );
//       }
//       if (transformedCustomer.address2 && transformedCustomer.address2.length > 100) {
//         throw new Error(
//           `Invalid customer data: 'address2' exceeds 100 characters at index ${index}: ${transformedCustomer.address2}`
//         );
//       }
//       if (transformedCustomer.city && transformedCustomer.city.length > 50) {
//         throw new Error(
//           `Invalid customer data: 'city' exceeds 50 characters at index ${index}: ${transformedCustomer.city}`
//         );
//       }
//       if (transformedCustomer.postCode && transformedCustomer.postCode.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'postCode' exceeds 20 characters at index ${index}: ${transformedCustomer.postCode}`
//         );
//       }
//       if (transformedCustomer.stateCode && transformedCustomer.stateCode.length > 10) {
//         throw new Error(
//           `Invalid customer data: 'stateCode' exceeds 10 characters at index ${index}: ${transformedCustomer.stateCode}`
//         );
//       }
//       if (transformedCustomer.countryRegionCode && transformedCustomer.countryRegionCode.length > 10) {
//         throw new Error(
//           `Invalid customer data: 'countryRegionCode' exceeds 10 characters at index ${index}: ${transformedCustomer.countryRegionCode}`
//         );
//       }
//       if (transformedCustomer.whatsappNo1 && transformedCustomer.whatsappNo1.length > 15) {
//         throw new Error(
//           `Invalid customer data: 'whatsappNo1' exceeds 15 characters at index ${index}: ${transformedCustomer.whatsappNo1}`
//         );
//       }
//       if (transformedCustomer.whatsappNo2 && transformedCustomer.whatsappNo2.length > 15) {
//         throw new Error(
//           `Invalid customer data: 'whatsappNo2' exceeds 15 characters at index ${index}: ${transformedCustomer.whatsappNo2}`
//         );
//       }
//       if (transformedCustomer.pANNo && transformedCustomer.pANNo.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'pANNo' exceeds 20 characters at index ${index}: ${transformedCustomer.pANNo}`
//         );
//       }
//       if (transformedCustomer.gstRegistrationNo && transformedCustomer.gstRegistrationNo.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'gstRegistrationNo' exceeds 20 characters at index ${index}: ${transformedCustomer.gstRegistrationNo}`
//         );
//       }
//       if (transformedCustomer.salesAgent && transformedCustomer.salesAgent.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'salesAgent' exceeds 20 characters at index ${index}: ${transformedCustomer.salesAgent}`
//         );
//       }
//       if (transformedCustomer.salesAgentName && transformedCustomer.salesAgentName.length > 100) {
//         throw new Error(
//           `Invalid customer data: 'salesAgentName' exceeds 100 characters at index ${index}: ${transformedCustomer.salesAgentName}`
//         );
//       }
//       if (transformedCustomer.salespersonCode && transformedCustomer.salespersonCode.length > 20) {
//         throw new Error(
//           `Invalid customer data: 'salespersonCode' exceeds 20 characters at index ${index}: ${transformedCustomer.salespersonCode}`
//         );
//       }
//       if (transformedCustomer.etag && transformedCustomer.etag.length > 100) {
//         throw new Error(
//           `Invalid customer data: 'etag' exceeds 100 characters at index ${index}: ${transformedCustomer.etag}`
//         );
//       }

//       return transformedCustomer;
//     });

//     // Perform bulk insert with conflict handling
//     const result = await db
//       .insert(navisionCustomerMaster)
//       .values(customersWithSchemaFields)
//       .onConflictDoNothing({ target: navisionCustomerMaster.no }) // Skip duplicates
//       .returning();

//     const insertedCount = result.length;
//     const skippedCount = customers.length - insertedCount;
//     console.log(`Inserted ${insertedCount} customers successfully, skipped ${skippedCount} duplicates`);
   
//   } catch (error: any) {
//     // Enhanced error logging
//     console.error('Error inserting customers:', {
//       message: error.message,
//       code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
//       detail: error.detail, // Detailed error message from PostgreSQL
//       stack: error.stack,
//       customersSample: customers.slice(0, 2), // Log first two records for inspection
//       query: error.query || 'N/A', // Log the failed query if available
//     });
//     throw new Error(`Error inserting customers: ${error.message}`);
//   }
// }



// // Define the insert type based on the schema

// async  bulkInsertVendors(vendors: any[]) {
//   try {
//     if (!vendors.length) {
//       console.log('No vendors to insert');
//       return [];
//     }

//     // Log the first vendor for debugging
//     console.log('Sample vendor data:', JSON.stringify(vendors[0], null, 2));

//     // Transform input data to match schema field names
//     const vendorsWithSchemaFields = vendors.map((vendor, index) => {
//       const transformedVendor: VendorInsert = {
//         no: vendor.No || vendor.no, // Handle both 'No' and 'no'
//         name: vendor.Name || vendor.name || null,
//         address: vendor.Address || vendor.address || null,
//         address2: vendor.Address_2 || vendor.address2 || null,
//         city: vendor.City || vendor.city || null,
//         postCode: vendor.Post_Code || vendor.postCode || null,
//         stateCode: vendor.State_Code || vendor.stateCode || null,
//         countryRegionCode: vendor.Country_Region_Code || vendor.countryRegionCode || null,
//         whatsappNo: vendor.Whatsapp_No || vendor.whatsappNo || null,
//         whatsappMobileNumber: vendor.Whatsapp_Mobile_Number || vendor.whatsappMobileNumber || null,
//         pANNo: vendor.P_A_N_No || vendor.pANNo || null,
//         gstRegistrationNo: vendor.GST_Registration_No || vendor.gstRegistrationNo || null,
//         beatName: vendor.Beat_Name || vendor.beatName || null,
//         salesAgentCustomer: vendor.Sales_Agent_Customer || vendor.salesAgentCustomer || null,
//         pointClaimCustomerType: vendor.Point_Claim_Customer_Type || vendor.pointClaimCustomerType || null,
//         ogs: vendor.OGS ?? vendor.ogs ?? false,
//         gujarat: vendor.Gujarat ?? vendor.gujarat ?? false,
//         etag: vendor.ETag || vendor.etag || null,
//         createdAt: vendor.CreatedAt || vendor.createdAt || sql`CURRENT_TIMESTAMP`, // Use database default
//         onboarded: vendor.Onboarded ?? vendor.onboarded ?? false, // Use schema default
//         onboardedAt: vendor.OnboardedAt || vendor.onboardedAt || null,
//       };

//       // Validate required fields
//       if (!transformedVendor.no) {
//         throw new Error(
//           `Invalid vendor data: Missing required field 'no' at index ${index}: ${JSON.stringify(vendor)}`
//         );
//       }

//       return transformedVendor;
//     });

//     // Perform bulk insert with conflict handling
//     const result = await db
//       .insert(navisionVendorMaster)
//       .values(vendorsWithSchemaFields)
//       .onConflictDoNothing({ target: navisionVendorMaster.no }) // Skip duplicates based on primary key
//       .returning();

//     console.log(`Inserted ${result.length} vendors successfully`);
//     return result;
//   } catch (error: any) {
//     // Enhanced error logging
//     console.error('Error inserting vendors:', {
//       message: error.message,
//       code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
//       detail: error.detail, // Detailed error message from PostgreSQL
//       stack: error.stack,
//       vendorsSample: vendors.slice(0, 2), // Log first two records
//       query: error.query || 'N/A', // Log the failed query if available
//     });
//     throw new Error(`Error inserting vendors: ${error.message}`);
//   }
// }

//   async  bulkInsertRetailers(retailers: any[]) {
//   try {
//     if (!retailers.length) {
//       console.log('No retailers to insert');
//       return [];
//     }

//     // Log the first retailer for debugging
//     console.log('Sample retailer data:', JSON.stringify(retailers[0], null, 2));

//     // Transform and validate input data to match schema
//     const retailersWithSchemaFields = retailers.map((retailer, index) => {
//       const transformedRetailer: RetailerInsert = {
//         no: retailer.No || retailer.no, // Handle both 'No' and 'no'
//         name: retailer.Name || retailer.name || null,
//         address: retailer.Address || retailer.address || null,
//         address2: retailer.Address_2 || retailer.address2 || null,
//         city: retailer.City || retailer.city || null,
//         postCode: retailer.Post_Code || retailer.postCode || null,
//         stateCode: retailer.State_Code || retailer.stateCode || null,
//         countryRegionCode: retailer.Country_Region_Code || retailer.countryRegionCode || null,
//         whatsappNo: retailer.Whatsapp_No || retailer.whatsappNo || null,
//         whatsappMobileNumber: retailer.Whatsapp_Mobile_Number || retailer.whatsappMobileNumber || null,
//         pANNo: retailer.P_A_N_No || retailer.pANNo || null,
//         gstRegistrationNo: retailer.GST_Registration_No || retailer.gstRegistrationNo || null,
//         beatName: retailer.Beat_Name || retailer.beatName || null,
//         salesAgentCustomer: retailer.Sales_Agent_Customer || retailer.salesAgentCustomer || null,
//         pointClaimCustomerType: retailer.Point_Claim_Customer_Type || retailer.pointClaimCustomerType || null,
//         ogs: retailer.OGS ?? retailer.ogs ?? false,
//         gujarat: retailer.Gujarat ?? retailer.gujarat ?? false,
//         etag: retailer.ETag || retailer.etag || null,
//         createdAt: retailer.CreatedAt || retailer.createdAt || sql`CURRENT_TIMESTAMP`, // Use database default
//         onboarded: retailer.Onboarded ?? retailer.onboarded ?? false, // Use schema default
//         onboardedAt: retailer.OnboardedAt || retailer.onboardedAt || null,
//       };

//       // Validate required fields and length constraints
//       if (!transformedRetailer.no) {
//         throw new Error(
//           `Invalid retailer data: Missing required field 'no' at index ${index}: ${JSON.stringify(retailer)}`
//         );
//       }
//       if (transformedRetailer.no.length > 20) {
//         throw new Error(
//           `Invalid retailer data: 'no' exceeds 20 characters at index ${index}: ${transformedRetailer.no}`
//         );
//       }
//       if (transformedRetailer.name && transformedRetailer.name.length > 100) {
//         throw new Error(
//           `Invalid retailer data: 'name' exceeds 100 characters at index ${index}: ${transformedRetailer.name}`
//         );
//       }
//       // Add similar length validations for other fields if needed
//       if (transformedRetailer.address && transformedRetailer.address.length > 100) {
//         throw new Error(
//           `Invalid retailer data: 'address' exceeds 100 characters at index ${index}: ${transformedRetailer.address}`
//         );
//       }
//       if (transformedRetailer.address2 && transformedRetailer.address2.length > 100) {
//         throw new Error(
//           `Invalid retailer data: 'address2' exceeds 100 characters at index ${index}: ${transformedRetailer.address2}`
//         );
//       }
//       if (transformedRetailer.city && transformedRetailer.city.length > 50) {
//         throw new Error(
//           `Invalid retailer data: 'city' exceeds 50 characters at index ${index}: ${transformedRetailer.city}`
//         );
//       }
//       if (transformedRetailer.postCode && transformedRetailer.postCode.length > 20) {
//         throw new Error(
//           `Invalid retailer data: 'postCode' exceeds 20 characters at index ${index}: ${transformedRetailer.postCode}`
//         );
//       }
//       if (transformedRetailer.stateCode && transformedRetailer.stateCode.length > 10) {
//         throw new Error(
//           `Invalid retailer data: 'stateCode' exceeds 10 characters at index ${index}: ${transformedRetailer.stateCode}`
//         );
//       }
//       if (transformedRetailer.countryRegionCode && transformedRetailer.countryRegionCode.length > 10) {
//         throw new Error(
//           `Invalid retailer data: 'countryRegionCode' exceeds 10 characters at index ${index}: ${transformedRetailer.countryRegionCode}`
//         );
//       }
//       if (transformedRetailer.whatsappNo && transformedRetailer.whatsappNo.length > 15) {
//         throw new Error(
//           `Invalid retailer data: 'whatsappNo' exceeds 15 characters at index ${index}: ${transformedRetailer.whatsappNo}`
//         );
//       }
//       if (transformedRetailer.whatsappMobileNumber && transformedRetailer.whatsappMobileNumber.length > 15) {
//         throw new Error(
//           `Invalid retailer data: 'whatsappMobileNumber' exceeds 15 characters at index ${index}: ${transformedRetailer.whatsappMobileNumber}`
//         );
//       }
//       if (transformedRetailer.pANNo && transformedRetailer.pANNo.length > 20) {
//         throw new Error(
//           `Invalid retailer data: 'pANNo' exceeds 20 characters at index ${index}: ${transformedRetailer.pANNo}`
//         );
//       }
//       if (transformedRetailer.gstRegistrationNo && transformedRetailer.gstRegistrationNo.length > 20) {
//         throw new Error(
//           `Invalid retailer data: 'gstRegistrationNo' exceeds 20 characters at index ${index}: ${transformedRetailer.gstRegistrationNo}`
//         );
//       }
//       if (transformedRetailer.beatName && transformedRetailer.beatName.length > 50) {
//         throw new Error(
//           `Invalid retailer data: 'beatName' exceeds 50 characters at index ${index}: ${transformedRetailer.beatName}`
//         );
//       }
//       if (transformedRetailer.salesAgentCustomer && transformedRetailer.salesAgentCustomer.length > 20) {
//         throw new Error(
//           `Invalid retailer data: 'salesAgentCustomer' exceeds 20 characters at index ${index}: ${transformedRetailer.salesAgentCustomer}`
//         );
//       }
//       if (transformedRetailer.pointClaimCustomerType && transformedRetailer.pointClaimCustomerType.length > 50) {
//         throw new Error(
//           `Invalid retailer data: 'pointClaimCustomerType' exceeds 50 characters at index ${index}: ${transformedRetailer.pointClaimCustomerType}`
//         );
//       }
//       if (transformedRetailer.etag && transformedRetailer.etag.length > 100) {
//         throw new Error(
//           `Invalid retailer data: 'etag' exceeds 100 characters at index ${index}: ${transformedRetailer.etag}`
//         );
//       }

//       return transformedRetailer;
//     });

//     // Perform bulk insert with conflict handling
//     const result = await db
//       .insert(navisionRetailMaster)
//       .values(retailersWithSchemaFields)
//       .onConflictDoNothing({ target: navisionRetailMaster.no }) // Skip duplicates
//       .returning();

//     const insertedCount = result.length;
//     const skippedCount = retailers.length - insertedCount;
//     console.log(`Inserted ${insertedCount} retailers successfully, skipped ${skippedCount} duplicates`);
//     return result;
//   } catch (error: any) {
//     // Enhanced error logging
//     console.error('Error inserting retailers:', {
//       message: error.message,
//       code: error.code, // PostgreSQL error code (e.g., '23505' for unique violation)
//       detail: error.detail, // Detailed error message from PostgreSQL
//       stack: error.stack,
//       retailersSample: retailers.slice(0, 2), // Log first two records for inspection
//       query: error.query || 'N/A', // Log the failed query if available
//     });
//     throw new Error(`Error inserting retailers: ${error.message}`);
//   }
// }
// }

// export default NavisionService;
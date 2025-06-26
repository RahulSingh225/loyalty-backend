import axios from 'axios';
import { navisionCustomerMaster, navisionVendorMaster, navisionRetailMaster } from '../db/schema';
import { db } from './db.service';
import dotenv from 'dotenv';

class NavisionService {
  constructor() {
    dotenv.config(); // Ensure dotenv is configured to load environment variables
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
      console.error('Error generating Basic Authorization:', error.message);
      throw error;
    }
  }

  async makeRequest(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH', data: any = null) {
    try {
      const config = {
        method: method.toUpperCase(),
        url: `${process.env.NAVISION_URL}${url}`,
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
      const result = await this.makeRequest('/VendorList_LoyaltyApp', 'GET');
      await this.bulkInsertVendors(result.value);
    } catch (error: any) {
      console.error('Error syncing vendor:', error);
      throw new Error('Failed to sync vendor data with Navision');
    }
  }

  async syncCustomer() {
    try {
      const result = await this.makeRequest('/CustomerList_LoyaltyApp', 'GET');
      await this.bulkInsertCustomers(result.value);
    } catch (error: any) {
      console.error('Error syncing customer:', error);
      throw new Error('Failed to sync customer data with Navision');
    }
  }

  async syncRetail() {
    try {
      const result = await this.makeRequest('/RetailList_LoyaltyApp', 'GET');
      await this.bulkInsertRetailers(result.value);
    } catch (error: any) {
      console.error('Error syncing retail:', error);
      throw new Error('Failed to sync retail data with Navision');
    }
  }

  async syncSalesInvoice(params: any) {
    // Logic to sync sales invoice data with Navision
  }

  async syncNotifyCustomer(params: any) {
    // Logic to notify customer about the sync status
  }

  async syncSalesPerson(params: any) {
    // Logic to sync sales person data with Navision
  }

  async bulkInsertCustomers(customers: typeof navisionCustomerMaster.$inferInsert[]) {
    try {
      const result = await db.insert(navisionCustomerMaster).values(customers).returning();
      console.log(`Inserted ${result.length} customers successfully`);
      return result;
    } catch (error: any) {
      console.error('Error inserting customers:', error);
      throw error;
    }
  }

  async bulkInsertVendors(vendors: typeof navisionVendorMaster.$inferInsert[]) {
    try {
      const result = await db.insert(navisionVendorMaster).values(vendors).returning();
      console.log(`Inserted ${result.length} vendors successfully`);
      return result;
    } catch (error: any) {
      console.error('Error inserting vendors:', error);
      throw error;
    }
  }

  async bulkInsertRetailers(retailers: typeof navisionRetailMaster.$inferInsert[]) {
    try {
      const result = await db.insert(navisionRetailMaster).values(retailers).returning();
      console.log(`Inserted ${result.length} retailers successfully`);
      return result;
    } catch (error: any) {
      console.error('Error inserting retailers:', error);
      throw error;
    }
  }
}

export default NavisionService;
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { navisionVendorMaster } from './db/schema'; // Adjust path to your schema file
import { db,pool } from './services/db.service';
// Database connection configuration


// Function to generate a username from the vendor name
function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').substring(0, 50); // Simple username generation
}

// Function to generate a default password
async function generatePassword(): Promise<string> {
  const saltRounds = 10;
  const defaultPassword = 'defaultPassword123'; // Replace with a secure random password generator if needed
  return bcrypt.hash(defaultPassword, saltRounds);
}

// Main function to onboard distributors
async function onboardDistributors(): Promise<void> {
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
        const username = generateUsername(vendor.name || 'vendor_' + vendor.no);
        const password = await generatePassword();
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
    await pool.end();
  }
}

// Execute the function
(async () => {
  await onboardDistributors();
})();
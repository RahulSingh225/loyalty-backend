import { pool } from "../services/db.service";
import logger from '../services/logger.service'


/**
 * Repository class for managing user-related operations in the loyalty backend system.
 * 
 * Provides methods to onboard retailers and distributors, authenticate users, 
 * retrieve user details, and manage user records. Interacts with the database 
 * using stored procedures for onboarding and authentication, and maintains an 
 * in-memory map for basic CRUD operations.
 * 
 * Methods:
 * - onBoardRetailer: Onboards a new retailer by calling the `onboard_retailer` stored procedure.
 * - onboardDistributor: Onboards a new distributor by calling the `onboard_distributor` stored procedure.
 * - loginUser: Authenticates a user using the `login_user` stored procedure.
 * - getUserById: Retrieves user details by user ID using the `get_user_details` stored procedure.
 * - updateUser: Updates user information in the in-memory map.
 * - deleteUser: Deletes a user from the in-memory map.
 * 
 * Note: Database operations rely on PostgreSQL stored procedures and require a valid `pool` and `logger` instance.
 */
class UserRepository {
  private users: Map<string, any> = new Map();

  /**
   * Onboards a new retailer user by inserting their details into the database.
   * 
   * This method calls the `onboard_retailer` stored procedure with the provided user data,
   * including credentials, contact information, shop details, and device information.
   * The user is assigned the 'retailer' role by default.
   * 
   * @param userData - An object containing the retailer's registration details:
   *   - username: string
   *   - mobile_number: string
   *   - secondary_mobile_number: string
   *   - hashedPassword: string
   *   - shop_name: string
   *   - shop_address: string
   *   - pin_code: string
   *   - city: string
   *   - state: string
   *   - fcm_token: string
   *   - device_details: object
   * @returns A promise that resolves to the onboarded retailer's user data.
   * @throws Will throw an error if the database operation fails.
   */
  async onBoardRetailer(userData: any): Promise<any> {
     const result = await pool.query(
      'SELECT onboard_retailer($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [
        userData.username, userData.mobile_number, userData.secondary_mobile_number, userData.hashedPassword, userData.shop_name, userData.shop_address,
        userData.home_address,userData.work_address, userData.pan,userData.aadhaar, userData.gstin,
        userData.pin_code, userData.city, userData.state, 'retailer', userData.fcm_token, JSON.stringify(userData.device_details)
      ]
    );
    logger.info('Retailer onboarded', { user_id: result.rows[0].onboard_retailer.user_id });
    return result.rows[0].onboard_retailer;
  }


  /**
   * Onboards a new distributor by inserting their details into the database.
   * 
   * Calls the `onboard_distributor` stored procedure with the provided user data.
   * Returns the onboarded distributor's information.
   *
   * @param userData - An object containing the distributor's details, including:
   *   - username: string
   *   - mobile_number: string
   *   - secondary_mobile_number: string
   *   - hashedPassword: string
   *   - distributor_name: string
   *   - contact_person: string
   *   - phone_number: string
   *   - email: string
   *   - address: string
   *   - city: string
   *   - state: string
   *   - zip_code: string
   *   - fcm_token: string
   *   - device_details: object
   * @returns A promise that resolves to the onboarded distributor's information.
   */
 
  /**
   * Onboards a new distributor by inserting their details into the database.
   * 
   * This method calls the `onboard_distributor` stored procedure with the provided user data,
   * including credentials, contact information, distributor details, and device information.
   * The user is assigned the 'distributor' role by default.
   * 
   * @swagger
   * /distributor/onboard:
   *   post:
   *     summary: Onboard a new distributor
   *     description: Registers a new distributor in the system.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               mobile_number:
   *                 type: string
   *               secondary_mobile_number:
   *                 type: string
   *               hashedPassword:
   *                 type: string
   *               distributor_name:
   *                 type: string
   *               contact_person:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               email:
   *                 type: string
   *               address:
   *                 type: string
   *               city:
   *                 type: string
   *               state:
   *                 type: string
   *               zip_code:
   *                 type: string
   *               fcm_token:
   *                 type: string
   *               device_details:
   *                 type: object
   *     responses:
   *       200:
   *         description: Distributor onboarded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 distributor_name:
   *                   type: string
   */
  async onboardDistributor(userData: any): Promise<any> {
    const result = await pool.query(
      'SELECT onboard_distributor($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
      [
        userData.username,
        userData.mobile_number,
        userData.secondary_mobile_number,
        userData.hashedPassword,
        userData.distributor_name,
        userData.contact_person,
        userData.phone_number,
        userData.email,
        userData.address,
        userData.city,
        userData.state,
        userData.zip_code,
        'distributor',
        userData.fcm_token,
        JSON.stringify(userData.device_details)
      ]
    );
    logger.info('Distributor onboarded', { user_id: result.rows[0].onboard_distributor.user_id });
    return result.rows[0].onboard_distributor;
  }
  async loginUser(payload:any): Promise<any> {
const result = await pool.query(
      'SELECT login_user($1, $2, $3, $4)',
      [payload.mobile_number, 'otp_verified', payload.fcm_token, JSON.stringify(payload.device_details)]
    );
    const userId = result.rows[0].login_user.user_id.toString();
    return result.rows[0].login_user;
  }

  async getUserById(id: string): Promise<any | null> {

    const result = await pool.query('SELECT get_user_details($1)', [parseInt(id)]);
    return result.rows.length > 0 ? result.rows[0].get_user_details : null;
  }

  async updateUser(id: string, userData: any): Promise<any> {
    if (!this.users.has(id)) {
      throw new Error('User not found');
    }
    const updatedUser = { ...this.users.get(id), ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error('User not found');
    }
    this.users.delete(id);
  }
}
export default UserRepository;
import { pool } from "../services/db.service";

class RedemptionRepository {
  async initiateRedemption(payload: any) {
    const result = await pool.query("SELECT initiateRedemption");
    return result;
  }

  async getRedemptions(userId: string) {
    const result = await pool.query(
      "SELECT * FROM redemptions WHERE userId = $1",
      [userId]
    );
    return result;
  }

  async calculateRedemptions(userId: string) {
    const result = await pool.query(
      "SELECT SUM(amount) FROM redemptions WHERE userId = $1",
      [userId]
    );
    return result;
  }

  async showRewards() {
    const result = await pool.query("SELECT * FROM rewards");
    return result;
  }
}

export default RedemptionRepository;

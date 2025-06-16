import { pool } from "../services/db.service";

class EarningRepository {
  async initiateEarning(payload: any) {
    const result = await pool.query("SELECT initiateEarning");
    return result;
  }

  async getEarnings(userId: string) {
    const result = await pool.query(
      "SELECT * FROM earnings WHERE userId = $1",
      [userId]
    );
    return result;
  }

  async calculateEarnings(userId: string) {
    const result = await pool.query(
      "SELECT SUM(amount) FROM earnings WHERE userId = $1",
      [userId]
    );
    return result;
  }
}

export default EarningRepository;

import { pool } from "../services/db.service";

class SchemeRepository {
  async createScheme(payload: any) {
    const result = await pool.query("SELECT createScheme");
    return result;
  }

  async getSchemes(userId: string) {
    const result = await pool.query("SELECT * FROM schemes WHERE userId = $1", [
      userId,
    ]);
    return result;
  }

  async updateScheme(schemeId: string, payload: any) {
    const result = await pool.query("SELECT updateScheme WHERE schemeId = $1", [
      schemeId,
    ]);
    return result;
  }

  async deleteScheme(schemeId: string) {
    const result = await pool.query("SELECT deleteScheme WHERE schemeId = $1", [
      schemeId,
    ]);
    return result;
  }

  async getSchemeEarnings(payload: any) {
    const result = await pool.query(
      "SELECT * FROM scheme_earnings WHERE schemeId = $1",
      [payload.schemeId]
    );
    return result;
  }
}

export default SchemeRepository;

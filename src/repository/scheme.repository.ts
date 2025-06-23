import { eq } from "drizzle-orm";
import { schemes } from "../db/schema";
import { db } from "../services/db.service";

class SchemeRepository {
  // async createScheme(payload: any) {
  //   const result = await db.query("SELECT createScheme");
  //   return result;
  // }

  async getSchemes(role_id: string) {
    const result = await db.select().from(schemes).where(eq(schemes.applicableRoles, Number(role_id)));
    return result;
  }

  // async updateScheme(schemeId: string, payload: any) {
  //   const result = await db.query("SELECT updateScheme WHERE schemeId = $1", [
  //     schemeId,
  //   ]);
  //   return result;
  // }

  // async deleteScheme(schemeId: string) {
  //   const result = await db.query("SELECT deleteScheme WHERE schemeId = $1", [
  //     schemeId,
  //   ]);
  //   return result;
  // }

  // async getSchemeEarnings(payload: any) {
  //   const result = await db.query(
  //     "SELECT * FROM scheme_earnings WHERE schemeId = $1",
  //     [payload.schemeId]
  //   );
  //   return result;
  // }
}

export default SchemeRepository;

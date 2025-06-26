import { eq, inArray, sql } from "drizzle-orm";
import { schemedetails, schemes } from "../db/schema";
import BaseRepository from "./base.repository";

class SchemeRepository extends BaseRepository {
  // async createScheme(payload: any) {
  //   const result = await db.query("SELECT createScheme");
  //   return result;
  // }

  async getSchemes(role_id: number) {
    var schemesResult = await this.db.select().from(schemes)
    
    .where(sql`${role_id} = ANY(${schemes.applicableRoles})`)

   const schemeIds = schemesResult.map((scheme: any) => scheme.schemeId);
      let detailsResult: [] = [];

      if (schemeIds.length > 0) {
        detailsResult = await this.db
          .select({
            id: schemedetails.id,
            schemeId: schemedetails.schemeId,
            groupName: schemedetails.groupName,
            multiplier: schemedetails.multiplier,
          })
          .from(schemedetails)
          .where(inArray(schemedetails.schemeId, schemeIds));
      }

      // Group scheme details by schemeId
      const detailsBySchemeId = detailsResult.reduce((acc, detail:any) => {
        if (!acc[detail.schemeId]) {
          acc[detail.schemeId] = [];
        }
        acc[detail.schemeId].push(detail);
        return acc;
      }, {});

      // Combine schemes with their details
      const result: [] = schemesResult.map((scheme: any) => ({
        ...scheme,
        slabs: detailsBySchemeId[scheme.schemeId] || [],
      }));
    
    
    
    return result
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

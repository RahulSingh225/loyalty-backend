import { eq, sql } from "drizzle-orm";
import { gifts, pointAllocationLog, redemptionRequest, userMaster } from "../db/schema";
import BaseRepository from "./base.repository";

class RedemptionRepository extends BaseRepository {
  async initiateRedemption(payload: any) {
    const result = await this.db.select({balance:userMaster.balancePoints}).from(userMaster).where(eq(userMaster.userId, payload.userId));
    if(result[0].balance < payload.amount) {
      throw new Error("Insufficient balance for redemption");
    }
   // Generate a unique redemptionId (e.g., UUID or custom logic)
      const redemptionId = `RED-${Date.now()}-${payload.userId}`;

      // Use $inferInsert type directly from redemptionRequest
      const values: typeof redemptionRequest.$inferInsert = {
        redemptionId,
        userId: Number(payload.userId),
        rewardId: payload.giftId,
        pointsValue: payload.amount.toFixed(2), // Convert to string with 2 decimal places to match numeric(10,2)
        status: 'pending',
        method: 'default', // Placeholder; adjust based on requirements
        pointsRedeemed: payload.amount, // Assuming pointsRedeemed equals amount
        createdAt: new Date().toISOString(), // Set current timestamp
      };
    const redemptionResult = await this.db.insert(redemptionRequest).values(values).returning();
    await this.db.execute(sql`update_points(${payload.userId}, ${payload.amount},'consume') `)

    return redemptionResult[0];
  }

  async getRedemptions(userId: string) {
    const result = await this.db.select().from(redemptionRequest).where(eq(redemptionRequest.userId, Number(userId)));
    return result;
  }

  async calculateRedemptions(userId: string) {
    const result = await this.db.select().from(redemptionRequest).where(eq(redemptionRequest.userId, Number(userId)))
    return result;
  }

  


  async showRewards() {
    const result = await this.db.select().from(gifts);
    return result;
  }

async updateRedemption(redemptionId: string, payload: any) {
return null
}

async getRedemptionDetails(redemptionId: string) {

return null
}


}


export default RedemptionRepository;

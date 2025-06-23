import { eq, sql } from "drizzle-orm";
import { gifts, pointAllocationLog, redemptionRequest, userMaster } from "../db/schema";
import { db } from "../services/db.service";

class RedemptionRepository {
  async initiateRedemption(payload: any) {
    const result = await db.select({balance:userMaster.balancePoints}).from(userMaster).where(eq(userMaster.userId, payload.userId));
    if(result[0].balance < payload.amount) {
      throw new Error("Insufficient balance for redemption");
    }
    const redemptionResult = await db.insert(redemptionRequest).values({
      userId: Number(payload.userId),
      rewardId: payload.giftId,
      pointsValue: payload.amount,
      status: "pending",
    }).returning();
    await db.execute(sql`update_points(${payload.userId}, ${payload.amount},'consume') `)

    return redemptionResult[0];
  }

  async getRedemptions(userId: string) {
    const result = await db.select().from(redemptionRequest).where(eq(redemptionRequest.userId, Number(userId)));
    return result;
  }

  async calculateRedemptions(userId: string) {
    const result = await db.select().from(redemptionRequest).where(eq(redemptionRequest.userId, Number(userId))).sum("amount");
    return result;
  }

  


  async showRewards() {
    const result = await db.select().from(gifts);
    return result;
  }
}

export default RedemptionRepository;

import { eq, sql } from "drizzle-orm";
import { gifts, pointAllocationLog, redemptionRequest, redemptionRewardLines, userMaster } from "../db/schema";
import BaseRepository from "./base.repository";

interface RedemptionPayload {
  userId: number;
  address: string;
  rewards: { amount: number; giftId: string; quantity: number }[];
}


class RedemptionRepository extends BaseRepository {
  async initiateRedemption(payload: RedemptionPayload, authUser: any) {
    const result = await this.db.select({ balance: userMaster.balancePoints }).from(userMaster).where(eq(userMaster.userId, payload.userId));
    if (result[0].balance < payload.rewards.reduce((acc, reward) => acc + reward.amount, 0)) {
      throw new Error("Insufficient balance for redemption");
    }
    try {
     await this.db.transaction(async (tx) => {
      // Insert header
      const [header] = await tx
        .insert(redemptionRequest)
        .values({
          redemptionId: `RED-${Date.now()}`, // Generate unique redemptionId (adjust as needed)
          userId: payload.userId,
          deliveryAddress: payload.address,
          method: 'gift',
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: authUser.userId,
          // Add other fields like distributorId, navisionId, etc., if needed
        })
        .returning({ requestId: redemptionRequest.requestId, redemptionId: redemptionRequest.redemptionId });

      // Insert lines
      const lineInserts = payload.rewards.map((reward) => ({
        requestId: header.requestId,
        redemptionId: header.redemptionId,
        rewardId: reward.giftId,
        pointsValue: reward.amount.toFixed(2),
        pointsRedeemed: reward.amount.toFixed(2), // Adjust if different logic
        quantity: reward.quantity,
        createdAt: new Date().toISOString(),
        createdBy: authUser.userId,
      }));

      await tx.insert(redemptionRewardLines).values(lineInserts);

      // Prepare Navision payload
      const navisionPayload = {
        header: {
          "Redemption ID": header.redemptionId,
          "User ID": payload.userId,
          "Delivery Address": payload.address,
          "Status": "pending",
          "Method": "gift",
          "Created At": new Date().toISOString(),
          "Created By": authUser.userId,
        },
        lines: payload.rewards.map((reward, index) => ({
          "Redemption ID": header.redemptionId,
          "Line ID": index + 1, // Placeholder; actual lineId assigned by DB
          "Reward ID": reward.giftId,
          "Points Value": parseFloat(reward.amount.toFixed(2)),
          "Points Redeemed": parseFloat(reward.amount.toFixed(2)),
          "Quantity": reward.quantity,
        })),
      };

      const nav= { requestId: header.requestId, navisionPayload };
      const response =  await this.db.execute(sql`SELECT * FROM public.update_points(${payload.userId}, ${payload.rewards.reduce((acc, reward) => acc + reward.amount, 0)},'consume') `)
   

    return header
    });
  } catch (error) {
      console.error("Error initiating redemption:", error);
      throw new Error("Failed to initiate redemption");
    }
 
   
  }

  async getRedemptions(userId: string) {
   const result = await this.db
  .select()
  .from(redemptionRequest)
  .innerJoin(redemptionRewardLines, eq(redemptionRewardLines.requestId, redemptionRequest.requestId))
  .innerJoin(gifts, eq(gifts.giftId, redemptionRewardLines.rewardId))
  .where(eq(redemptionRequest.userId, Number(userId)));
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

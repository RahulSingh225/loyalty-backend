import { and, eq, inArray } from "drizzle-orm";
import { pointAllocationLog, userMaster } from "../db/schema";
import { db } from "../services/db.service";

class EarningRepository {
  // async initiateEarning(payload: any) {
  //   const result = await db.select().from(userMaster).where(eq(userMaster.userId, payload.userId));
  //   if (result[0].balancePoints < payload.amount) {
  //     throw new Error("Insufficient balance for earning");
  //   }
  //   const earningResult = await db.insert(earnin).values({
  //     userId: Number(payload.userId),
  //     amount: payload.amount,
  //     status: "pending",
  //   }).returning();
  //   return earningResult[0];
  // }

  // async getEarnings(userId: string) {
  //   const result = await pool.query(
  //     "SELECT * FROM earnings WHERE userId = $1",
  //     [userId]
  //   );
  //   return result;
  // }

  // async calculateEarnings(userId: string) {
  //   const result = await pool.query(
  //     "SELECT SUM(amount) FROM earnings WHERE userId = $1",
  //     [userId]
  //   );
  //   return result;
  // }

  async pointsTransfer(payload:typeof pointAllocationLog.$inferInsert) {
console.log(payload)

    const result = await db.select().from(userMaster).where(inArray(userMaster.userId, [payload.sourceUserId, payload.targetUserId]));
    if (result.length !== 2) {
      throw new Error("User not found");
    }
    console.log("Users found:", result);
    // Check if source user has enough balance
    const sourceUser = result.find(user => user.userId == payload.sourceUserId);
    console.log("Source User:", sourceUser);
    if (Number(sourceUser.balancePoints) < Number(payload.pointsAllocated)) {
      throw new Error("Insufficient balance for transfer");
    }
    if( Number(payload.pointsAllocated) !== payload.details.reduce((sum:any, detail:any) => sum + (typeof detail?.multiplier === 'number' && !isNaN(detail.multiplier) && typeof detail?.qty === 'number' && !isNaN(detail.qty) ? detail.multiplier * detail.qty : 0), 0) ){

      console.log("Payload details:", payload.details);
      console.log("Calculated total points:", payload.details.reduce((sum:any, detail:any) => sum + (typeof detail?.multiplier === 'number' && !isNaN(detail.multiplier) && typeof detail?.qty === 'number' && !isNaN(detail.qty) ? detail.multiplier * detail.qty : 0), 0) );
      console.log("Points allocated:", payload.pointsAllocated);
      throw new Error("Points allocated must match the total points from details");
    }

    await db.transaction(async (tx) => {
      // Deduct points from source user
      await tx.update(userMaster).set({
        balancePoints: String(Number(sourceUser.balancePoints) - Number(payload.pointsAllocated)) ,
        
      }).where(eq(userMaster.userId, payload.sourceUserId));

      await tx.update(userMaster).set({
        balancePoints: String(Number(result.find(user => user.userId == payload.targetUserId).balancePoints) + Number(payload.pointsAllocated)),
        totalPoints: String(Number(result.find(user => user.userId == payload.targetUserId).totalPoints) + Number(payload.pointsAllocated)),
      }).where(eq(userMaster.userId, payload.targetUserId));

      const transferResult = await tx.insert(pointAllocationLog).values({
      sourceUserId: payload.sourceUserId,
      targetUserId: payload.targetUserId,
      pointsAllocated: payload.pointsAllocated,
      allocationMethod:'points_transfer',
      details: payload.details,
      status: "pending",
    }).returning();

    return transferResult[0];
    })
    // Assuming you have a pointsTransfer table to log transfers
    
  }
}




    

export default EarningRepository;

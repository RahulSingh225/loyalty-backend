import { eq } from "drizzle-orm";
import { userMaster } from "../db/schema";
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
}

export default EarningRepository;

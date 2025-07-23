import { eq, sql } from "drizzle-orm";
import { gifts, navisionCustomerMaster, navisionNotifyCustomer, navisionRetailMaster, navisionVendorMaster, pointAllocationLog, redemptionRequest, redemptionRewardLines, retailer, userMaster } from "../db/schema";
import BaseRepository from "./base.repository";
import { ClaimPostPayload, ConsolidatedRetailerData } from "../types";
import { GlobalState } from "../configs/config";
import moment from "moment";
import { auth } from "firebase-admin";
import NavisionService from "../services/navision.service";

interface RedemptionPayload {
  userId: number;
  address: string;
  rewards: { amount: number; giftId: string; quantity: number }[];
}


class RedemptionRepository extends BaseRepository {
  async initiateRedemption(payload: RedemptionPayload, authUser: any) {
    console.log(payload)

    const [authUserDetails] = await this.db.select().from(userMaster).where(eq(userMaster.userId,authUser.userId))


 const [retailerDetails] = await this.db.select({
    retailerId: retailer.retailerId,
    userId: retailer.userId,
    distributorId: retailer.distributorId,
    shopName: retailer.shopName,
    shopAddress: retailer.shopAddress,
    pinCode: retailer.pinCode,
    city: retailer.city,
    state: retailer.state,
    whatsappNo: retailer.whatsappNo,
    panNo: retailer.panNo,
    gstRegistrationNo: retailer.gstRegistrationNo,
    aadhaarCardNo: retailer.aadhaarCardNo,
    navisionId: retailer.navisionId,
    onboardingStatus: retailer.onboardingStatus,
    createdAt: retailer.createdAt,
    updatedAt: retailer.updatedAt,
    totalPoints: retailer.totalPoints,
    balancePoints: retailer.balancePoints,
    consumedPoints: retailer.consumedPoints,
    homeAddress: retailer.homeAddress,
    workAddress: retailer.workAddress,
    beatName: retailer.beatName,
    retailerCode: retailer.retailerCode,
    salesAgentCodee: retailer.salesAgentCodee,
    salesAgentNamee: retailer.salesAgentNamee,
    salesAgentId: retailer.salesAgentId,
    address2: sql<string | null>`COALESCE(${navisionRetailMaster.address2}, ${navisionCustomerMaster.address2}, ${navisionNotifyCustomer.address2})`,
    countryRegionCode: sql<string | null>`COALESCE(${navisionRetailMaster.countryRegionCode}, ${navisionCustomerMaster.countryRegionCode}, ${navisionNotifyCustomer.countryRegionCode})`,
    whatsappNo2: sql<string | null>`COALESCE(${navisionRetailMaster.whatsappNo2}, ${navisionCustomerMaster.whatsappNo2}, ${navisionNotifyCustomer.whatsappNo2})`,
    salesPersonCode: sql<string | null>`COALESCE(${navisionRetailMaster.salesPersonCode}, ${navisionCustomerMaster.salespersonCode}, ${navisionNotifyCustomer.salesPerson})`,
    salesPersonName: sql<string | null>`COALESCE(${navisionRetailMaster.salesPersonName}, ${navisionCustomerMaster.salesAgentName}, ${navisionNotifyCustomer.salesAgentName})`,
    agentName: sql<string | null>`COALESCE(${navisionRetailMaster.agentName}, ${navisionCustomerMaster.salesAgentName}, ${navisionNotifyCustomer.salesAgentName})`,
    agentCode:sql<string | null>`COALESCE(${navisionRetailMaster.agentCode}, ${navisionCustomerMaster.salesAgent}, ${navisionNotifyCustomer.salesAgent})`,
    supplyFrom: navisionRetailMaster.supplyFrom,
    gujarat: navisionRetailMaster.gujarat,
    etag: sql<string | null>`COALESCE(${navisionRetailMaster.etag}, ${navisionCustomerMaster.etag}, ${navisionNotifyCustomer.etag})`,
    onboarded: sql<boolean | null>`COALESCE(${navisionRetailMaster.onboarded}, ${navisionCustomerMaster.onboarded}, ${navisionNotifyCustomer.onboarded})`,
    onboardedAt: sql<string | null>`COALESCE(${navisionRetailMaster.onboardedAt}, ${navisionCustomerMaster.onboardedAt}, ${navisionNotifyCustomer.onboardedAt})`,
    name: sql<string | null>`COALESCE(${navisionCustomerMaster.name}, ${navisionNotifyCustomer.name})`,
    stateCode: sql<string | null>`COALESCE(${navisionCustomerMaster.stateCode}, ${navisionNotifyCustomer.stateCode})`,
    agentCodeVisibility: navisionNotifyCustomer.agentCodeVisibility,
    sourceTable: sql<string | null>`CASE 
      WHEN ${navisionRetailMaster.no} IS NOT NULL THEN 'navision_retail_master'
      WHEN ${navisionCustomerMaster.no} IS NOT NULL THEN 'navision_customer_master'
      WHEN ${navisionNotifyCustomer.no} IS NOT NULL THEN 'navision_notify_customer'
      ELSE NULL
    END`
  })
  .from(retailer)
  .where(eq(retailer.userId,payload.userId))
  .leftJoin(navisionRetailMaster, eq(retailer.navisionId, navisionRetailMaster.no))
  .leftJoin(navisionCustomerMaster, eq(retailer.navisionId, navisionCustomerMaster.no))
  .leftJoin(navisionNotifyCustomer, eq(retailer.navisionId, navisionNotifyCustomer.no));
      
console.log(retailerDetails)


    const result = await this.db.select({ balance: userMaster.balancePoints }).from(userMaster).where(eq(userMaster.userId, payload.userId));
    if (result[0].balance < payload.rewards.reduce((acc, reward) => acc + reward.amount, 0)) {
      throw new Error("Insufficient balance for redemption");
    }
    
   try {
    return await this.db.transaction(async (tx) => {
      // Validate inputs
      if (!payload.userId || !payload.rewards.length || !authUser.userId || !authUserDetails.username || !retailerDetails || !GlobalState.schemeFilter) {
        throw new Error('Invalid input: Missing required fields');
      }

      // Format dates
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('.')[0];
      const currentDateTime = new Date().toISOString();

      // Insert header
      const [header] = await tx
        .insert(redemptionRequest)
        .values({
          redemptionId: `RED-${Date.now()}`,
          userId: payload.userId,
          deliveryAddress: payload.address,
          method: 'Claim',
          status: 'Submitted',
          createdAt: currentDateTime,
          createdBy: authUser.userId,
        })
        .returning({ requestId: redemptionRequest.requestId, redemptionId: redemptionRequest.redemptionId });

      if (!header) {
        throw new Error('Failed to insert redemption header');
      }

      // Insert lines
      const lineInserts = payload.rewards.map((reward) => {
        if (!reward.giftId || reward.amount < 0 || reward.quantity <= 0) {
          throw new Error(`Invalid reward data: giftId=${reward.giftId}, amount=${reward.amount}, quantity=${reward.quantity}`);
        }
        return {
          requestId: header.requestId,
          redemptionId: header.redemptionId,
          rewardId: reward.giftId,
          pointsValue: reward.amount.toFixed(2),
          pointsRedeemed: reward.amount.toFixed(2),
          quantity: reward.quantity,
          createdAt: currentDateTime,
          createdBy: authUser.userId,
        };
      });

      await tx.insert(redemptionRewardLines).values(lineInserts);

      // Prepare header item
      const headerItem: ClaimPostPayload = {
        Header: true,
        Document_No: header.redemptionId,
        Entry_Type: 'Points Claim',
        Customer_No: retailerDetails.sourceTable === 'navision_customer_master' ? retailerDetails.navisionId : '',
        Agent_Code: retailerDetails.agentCode || '',
        Notify_Customer: retailerDetails.sourceTable === 'navision_notify_customer' ? retailerDetails.navisionId : '',
        Retailer_No: retailerDetails.sourceTable === 'navision_retail_master' ? retailerDetails.navisionId : '',
        Sales_Person_Code: retailerDetails.salesPersonCode || '',
        Scheme: GlobalState.schemeFilter,
        Invoice_No: '',
        Order_Date: startOfDay,
        Remarks: '',
        Sales_Point_Created_By: authUserDetails.username,
        Sales_Point_Created_DateTime: currentDateTime,
        Sales_Point_Created_Date: startOfDay,
        Quality: '',
        Quality_Desc: '',
        Quantity: '0',
        Total_available_points: retailerDetails.totalPoints.toString(),
        Total_Transferred_Points: payload.rewards.reduce((acc, reward) => acc + reward.amount, 0).toString(),
      };

      // Prepare line items
      const lineItems: ClaimPostPayload[] = [];
      lineItems.push(headerItem);
      for (const item of payload.rewards) {
        const [giftDetails] = await tx
          .select()
          .from(gifts)
          .where(eq(gifts.giftId, parseInt(item.giftId)));

        if (!giftDetails) {
          throw new Error(`Gift not found for giftId: ${item.giftId}`);
        }

        const lineItem: ClaimPostPayload = {
          Header: false,
          Document_No: header.redemptionId,
          Entry_Type: 'Points Claim',
          Customer_No: retailerDetails.sourceTable === 'navision_customer_master' ? retailerDetails.navisionId : '',
          Agent_Code: retailerDetails.agentCode || '',
          Notify_Customer: retailerDetails.sourceTable === 'navision_notify_customer' ? retailerDetails.navisionId : '',
          Retailer_No: retailerDetails.sourceTable === 'navision_retail_master' ? retailerDetails.navisionId : '',
          Sales_Person_Code: retailerDetails.salesPersonCode || '',
          Scheme: GlobalState.schemeFilter,
          Invoice_No: '',
          Order_Date: startOfDay,
          Remarks: '',
          Sales_Point_Created_By: authUserDetails.username,
          Sales_Point_Created_DateTime: currentDateTime,
          Sales_Point_Created_Date: startOfDay,
          Quality: giftDetails.uniqueId,
          Quality_Desc: giftDetails.giftName,
          Quantity: item.quantity.toString(),
          Total_available_points: retailerDetails.totalPoints.toString(),
          Total_Transferred_Points: payload.rewards.reduce((acc, reward) => acc + reward.amount, 0).toString(),
        };
        lineItems.push(lineItem);
      }

      // Add header item
      
      console.log(lineItems[0])

      // Post to Navision
      const nav = new NavisionService();
      for (const item of lineItems) {
        await nav.postClaimTransfer(item).catch((err) => {
          throw new Error(`Navision service failed for item ${item.Document_No}: ${JSON.stringify(err)}`);
        });
      }

      // Update points
      const totalPoints = payload.rewards.reduce((acc, reward) => acc + reward.amount, 0);
      await tx.update(userMaster)
  .set({
    balancePoints: sql`${userMaster.balancePoints} - ${totalPoints}`,redeemedPoints:sql`${userMaster.redeemedPoints}+${totalPoints}`
  })
  .where(eq(userMaster.userId, payload.userId));

await tx.update(retailer)
  .set({
    balancePoints: sql`${retailer.balancePoints} - ${totalPoints}`,consumedPoints: sql`${retailer.consumedPoints}+${totalPoints}`
  })
  .where(eq(retailer.userId, payload.userId));
      // await tx.execute(sql`SELECT * FROM public.update_points(${payload.userId}, ${totalPoints}, 'consume')`);

      return header;
    });
  } catch (error) {
    console.error('Error initiating redemption:', error);
    throw new Error(`Redemption failed: ${error.message}`);
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

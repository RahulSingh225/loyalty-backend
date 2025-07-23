import { and, eq, inArray, sql } from "drizzle-orm";
import { navisionCustomerMaster, navisionNotifyCustomer, navisionRetailMaster, pointAllocationLog, retailer, userMaster } from "../db/schema";
import { db } from "../services/db.service";
import { startOfDay } from "date-fns";
import { GlobalState } from "../configs/config";
import { ClaimPostPayload } from "../types";
import moment from "moment";
import NavisionService from "../services/navision.service";

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

  async pointsTransfer(payload:typeof pointAllocationLog.$inferInsert,authUser:any) {
 console.log('Payload:', payload);

  // Fetch source and target users
  const users = await db
    .select()
    .from(userMaster)
    .where(inArray(userMaster.userId, [payload.sourceUserId, payload.targetUserId]));
  
  if (users.length !== 2) {
    throw new Error('User not found');
  }
  console.log('Users found:', users);

  // Validate source user balance
  const sourceUser = users.find(user => user.userId === payload.sourceUserId);
  if (!sourceUser) {
    throw new Error('Source user not found');
  }
  console.log('Source User:', sourceUser);

  const pointsAllocated = Number(payload.pointsAllocated);
  if (Number(sourceUser.balancePoints) < pointsAllocated) {
    throw new Error('Insufficient balance for transfer');
  }

  // Validate total points from details
  const totalDetailPoints = payload.details.reduce((sum:any, detail:any) => {
    return sum + (typeof detail?.multiplier === 'number' && !isNaN(detail.multiplier) &&
                  typeof detail?.qty === 'number' && !isNaN(detail.qty)
                  ? detail.multiplier * detail.qty : 0);
  }, 0);

  if (pointsAllocated !== totalDetailPoints) {
    console.log('Payload details:', payload.details);
    console.log('Calculated total points:', totalDetailPoints);
    console.log('Points allocated:', pointsAllocated);
    throw new Error('Points allocated must match the total points from details');
  }

  // Fetch auth user details
  const [authUserDetails] = await db
    .select()
    .from(userMaster)
    .where(eq(userMaster.userId, authUser.userId));

  if (!authUserDetails) {
    throw new Error('Authenticated user details not found');
  }

  // Fetch retailer details
  const [retailerDetails] = await db
    .select({
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
      agentCode: sql<string | null>`COALESCE(${navisionRetailMaster.agentCode}, ${navisionCustomerMaster.salesAgent}, ${navisionNotifyCustomer.salesAgent})`,
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
      END`,
    })
    .from(retailer)
    .where(eq(retailer.userId, payload.targetUserId))
    .leftJoin(navisionRetailMaster, eq(retailer.navisionId, navisionRetailMaster.no))
    .leftJoin(navisionCustomerMaster, eq(retailer.navisionId, navisionCustomerMaster.no))
    .leftJoin(navisionNotifyCustomer, eq(retailer.navisionId, navisionNotifyCustomer.no));

  console.log('Retailer Details:', retailerDetails);

  try {
    return await db.transaction(async (tx) => {
      // Update source user balance
      await tx
        .update(userMaster)
        .set({
          balancePoints: String(Number(sourceUser.balancePoints) - pointsAllocated),
        })
        .where(eq(userMaster.userId, payload.sourceUserId));

      // Update target user balance and total points
      const targetUser = users.find(user => user.userId === payload.targetUserId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }
      await tx
        .update(userMaster)
        .set({
          balancePoints: String(Number(targetUser.balancePoints) + pointsAllocated),
          totalPoints: String(Number(targetUser.totalPoints) + pointsAllocated),
        })
        .where(eq(userMaster.userId, payload.targetUserId));

      // Insert point allocation log
      const [transferResult] = await tx
        .insert(pointAllocationLog)
        .values({
          sourceUserId: payload.sourceUserId,
          targetUserId: payload.targetUserId,
          pointsAllocated: payload.pointsAllocated,
          allocationMethod: 'points_transfer',
          details: payload.details,
          status: 'pending',
          documentNo: `TR-${Date.now()}`,
        })
        .returning({ documentNo: pointAllocationLog.documentNo });

      // Process payload details for claim posting
      let invoiceNo: string | null = null;
      let invoiceDate: string | null = null;
      const groupDetails: { group_name: string; qty: number }[] = [];

      payload.details.forEach((item:any) => {
        if (item.invoice_no) invoiceNo = item.invoice_no;
        if (item.invoice_date) invoiceDate = item.invoice_date;
        if (item.group && item.qty != null) {
          groupDetails.push({
            group_name: item.group,
            qty: item.qty,
          });
        }
      });

      // Prepare header item for Navision
      const headerItem: ClaimPostPayload = {
        Header: true,
        Document_No: transferResult.documentNo,
        Entry_Type: 'Points Transfer',
        Customer_No: retailerDetails.sourceTable === 'navision_customer_master' ? retailerDetails.navisionId : '',
        Agent_Code: retailerDetails.agentCode || '',
        Notify_Customer: retailerDetails.sourceTable === 'navision_notify_customer' ? retailerDetails.navisionId : '',
        Retailer_No: retailerDetails.sourceTable === 'navision_retail_master' ? retailerDetails.navisionId : '',
        Sales_Person_Code: retailerDetails.salesPersonCode || '',
        Scheme: GlobalState.schemeFilter,
        Invoice_No: invoiceNo ?? '',
        Order_Date: invoiceDate ? moment(invoiceDate).startOf('day').format('YYYY-MM-DDT00:00:00') : '',
        Remarks: '',
        Sales_Point_Created_By: authUserDetails.username,
        Sales_Point_Created_DateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
        Sales_Point_Created_Date: moment().startOf('day').format('YYYY-MM-DDT00:00:00'),
        Quality: '',
        Quality_Desc: '',
        Quantity: '',
        Total_available_points: sourceUser.totalPoints.toString(),
        Total_Transferred_Points: payload.pointsAllocated.toString(),
      };
const lineItems: ClaimPostPayload[]=[]
            lineItems.push(headerItem);


      // Prepare line items for Navision
        groupDetails.map((item) => (lineItems.push({
        Header: false,
        Document_No: transferResult.documentNo,
        Entry_Type: 'Points Transfer',
        Customer_No: retailerDetails.sourceTable === 'navision_customer_master' ? retailerDetails.navisionId : '',
        Agent_Code: retailerDetails.agentCode || '',
        Notify_Customer: retailerDetails.sourceTable === 'navision_notify_customer' ? retailerDetails.navisionId : '',
        Retailer_No: retailerDetails.sourceTable === 'navision_retail_master' ? retailerDetails.navisionId : '',
        Sales_Person_Code: retailerDetails.salesPersonCode || '',
        Scheme: GlobalState.schemeFilter,
        Invoice_No: '',
        Order_Date: invoiceDate ? moment(invoiceDate).startOf('day').format('YYYY-MM-DDT00:00:00') : '',
        Remarks: '',
        Sales_Point_Created_By: authUserDetails.username,
        Sales_Point_Created_DateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
        Sales_Point_Created_Date: moment().startOf('day').format('YYYY-MM-DDT00:00:00'),
        Quality: item.group_name,
        Quality_Desc: item.group_name,
        Quantity: item.qty.toString(),
        Total_available_points: sourceUser.totalPoints.toString(),
        Total_Transferred_Points: payload.pointsAllocated.toString(),
      })));


      // Post claims to Navision
      const nav = new NavisionService();
      for (const item of lineItems) {
        await nav.postClaimTransfer(item).catch((err) => {
          throw new Error(`Navision service failed for item ${item.Document_No}: ${JSON.stringify(err)}`);
        });
      }

      return transferResult;
    });
  } catch (error) {
    throw new Error(`Transfer failed: ${(error as Error).message}`);
  }
    // Assuming you have a pointsTransfer table to log transfers
    
  }
}




    

export default EarningRepository;

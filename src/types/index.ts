export interface ClaimPostPayload {
  Header: boolean;
  Document_No: string;
  Entry_Type: string;
  Customer_No: string;
  Agent_Code: string;
  Notify_Customer: string;
  Retailer_No: string;
  Sales_Person_Code: string;
  Scheme: string;
  Invoice_No: string;
  Order_Date: string; // ISO string
  Remarks: string;
  Sales_Point_Created_By: string;
  Sales_Point_Created_DateTime: string; // ISO string
  Sales_Point_Created_Date: string; // ISO string
  Quality: string;
  Quality_Desc: string;
  Quantity: string;
  Total_available_points: string;
  Total_Transferred_Points: string;
}


export interface ConsolidatedRetailerData {
  retailerId: number;
  userId: number;
  distributorId: number | null;
  shopName: string;
  shopAddress: string | null;
  pinCode: string | null;
  city: string | null;
  state: string | null;
  whatsappNo: string | null;
  panNo: string | null;
  gstRegistrationNo: string | null;
  aadhaarCardNo: string | null;
  navisionId: string | null;
  onboardingStatus: string;
  createdAt: string;
  updatedAt: string;
  totalPoints: string;
  balancePoints: string;
  consumedPoints: string;
  homeAddress: string | null;
  workAddress: string | null;
  beatName: string | null;
  retailerCode: string | null;
  salesAgentCodee: string | null;
  salesAgentNamee: string | null;
  salesAgentId: number | null;
  // Fields from Navision tables
  address2: string | null;
  countryRegionCode: string | null;
  whatsappNo2: string | null;
  salesPersonCode: string | null;
  salesPersonName: string | null;
  agentName: string | null;
  agentCode: string | null;
  supplyFrom: string | null;
  gujarat: boolean | null;
  etag: string | null;
  onboarded: boolean | null;
  onboardedAt: string | null;
  name: string | null;
  stateCode: string | null;
  agentCodeVisibility: boolean | null;
  sourceTable: string | null;
};
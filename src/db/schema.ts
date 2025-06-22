import {
  pgTable,
  foreignKey,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const distributor = pgTable(
  "distributor",
  {
    distributorId: serial("distributor_id").notNull(),
    userId: integer("user_id").notNull(),
    distributorName: varchar("distributor_name", { length: 255 }).notNull(),
    contactPerson: varchar("contact_person", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    email: varchar({ length: 255 }),
    address: text(),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    zipCode: varchar("zip_code", { length: 20 }),
    gstNumber: varchar("gst_number", { length: 15 }),
    navisionId: varchar("navision_id", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    totalPoints: integer("total_points"),
    balancePoints: integer("balance_points"),
    consumedPoints: integer("consumed_points"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "distributor_user_id_fkey",
    }),
  ]
);

export const retailer = pgTable(
  "Retailer",
  {
    retailerId: serial("retailer_id").notNull(),
    userId: integer("user_id").notNull(),
    distributorId: integer("distributor_id"),
    shopName: varchar("shop_name", { length: 255 }).notNull(),
    shopAddress: text("shop_address"),
    pinCode: varchar("pin_code", { length: 20 }),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    whatsappNo: varchar("whatsapp_no", { length: 20 }),
    panNo: varchar("pan_no", { length: 20 }),
    gstRegistrationNo: varchar("gst_registration_no", { length: 50 }),
    aadhaarCardNo: varchar("aadhaar_card_no", { length: 20 }),
    navisionId: varchar("navision_id", { length: 100 }),
    onboardingStatus: varchar("onboarding_status", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    totalPoints: integer("total_points"),
    balancePoints: integer("balance_points"),
    consumedPoints: integer("consumed_points"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "Retailer_user_id_fkey",
    }),
    foreignKey({
      columns: [table.distributorId],
      foreignColumns: [distributor.distributorId],
      name: "Retailer_distributor_id_fkey",
    }),
  ]
);

export const userRoles = pgTable("user_roles", {
  roleId: serial("role_id").notNull(),
  roleName: varchar("role_name", { length: 50 }).notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id").notNull(),
    permissionId: integer("permission_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [userRoles.roleId],
      name: "role_permissions_role_id_fkey",
    }),
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [permissions.permissionId],
      name: "role_permissions_permission_id_fkey",
    }),
  ]
);

export const permissions = pgTable("permissions", {
  permissionId: serial("permission_id").notNull(),
  permissionName: varchar("permission_name", { length: 100 }).notNull(),
});

export const userMaster = pgTable(
  "user_master",
  {
    userId: serial("user_id").notNull(),
    username: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
    secondaryMobileNumber: varchar("secondary_mobile_number", {
      length: 20,
    }).notNull(),
    userType: varchar("user_type", { length: 50 }).notNull(),
    roleId: integer("role_id"),
    isActive: boolean("is_active"),
    bankAccountName: varchar("bank_account_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 50 }),
    ifscCode: varchar("ifsc_code", { length: 20 }),
    upi: varchar({ length: 100 }),
    totalPoints: integer("total_points"),
    balancePoints: integer("balance_points"),
    redeemedPoints: integer("redeemed_points"),
    fcmToken: text("fcm_token"),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    lastLoginAt: timestamp("last_login_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [userRoles.roleId],
      name: "user_master_role_id_fkey",
    }),
  ]
);

export const appSettings = pgTable("app_settings", {
  settingId: serial("setting_id").notNull(),
  appName: varchar("app_name", { length: 255 }).notNull(),
  shortDescription: varchar("short_description", { length: 255 }),
  companyLogoUrl: varchar("company_logo_url", { length: 255 }),
  themeColor: varchar("theme_color", { length: 50 }),
  gettingStartedImageUrl: varchar("getting_started_image_url", { length: 255 }),
  primaryColor: varchar("primary_color", { length: 20 }),
  secondaryColor: varchar("secondary_color", { length: 20 }),
  language: varchar({ length: 50 }),
  font: varchar({ length: 50 }),
  bannerImageUrl: varchar("banner_image_url", { length: 255 }),
  homeImageUrl: varchar("home_image_url", { length: 255 }),
  landingImageUrl: varchar("landing_image_url", { length: 255 }),
  resourceBaseUrl: varchar("resource_base_url", { length: 255 }),
  apiBaseUrl: varchar("api_base_url", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const pointAllocationLog = pgTable(
  "point_allocation_log",
  {
    allocationId: serial("allocation_id").notNull(),
    invoiceId: integer("invoice_id").notNull(),
    sourceUserId: integer("source_user_id"),
    targetUserId: integer("target_user_id").notNull(),
    pointsAllocated: integer("points_allocated").notNull(),
    allocationDate: timestamp("allocation_date", { mode: "string" }),
    allocationMethod: varchar("allocation_method", { length: 50 }).notNull(),
    status: varchar({ length: 50 }),
    adminApprovedBy: integer("admin_approved_by"),
    adminApprovalDate: timestamp("admin_approval_date", { mode: "string" }),
    description: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.sourceUserId],
      foreignColumns: [userMaster.userId],
      name: "point_allocation_log_source_user_id_fkey",
    }),
    foreignKey({
      columns: [table.targetUserId],
      foreignColumns: [userMaster.userId],
      name: "point_allocation_log_target_user_id_fkey",
    }),
    foreignKey({
      columns: [table.adminApprovedBy],
      foreignColumns: [userMaster.userId],
      name: "point_allocation_log_admin_approved_by_fkey",
    }),
  ]
);

export const contentManagement = pgTable("content_management", {
  contentId: serial("content_id").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  content: text(),
  imagePdfUrl: varchar("image_pdf_url", { length: 255 }),
  lastUpdatedAt: timestamp("last_updated_at", { mode: "string" }),
});

export const mediaLinks = pgTable("media_links", {
  linkId: serial("link_id").notNull(),
  platformName: varchar("platform_name", { length: 100 }).notNull(),
  linkUrl: varchar("link_url", { length: 255 }).notNull(),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const redemptionRequest = pgTable(
  "redemption_request",
  {
    requestId: serial("request_id").notNull(),
    redemptionId: varchar("redemption_id", { length: 100 }).notNull(),
    userId: integer("user_id").notNull(),
    distributorId: integer("distributor_id"),
    rewardId: integer("reward_id").notNull(),
    method: varchar({ length: 50 }).notNull(),
    pointsRedeemed: integer("points_redeemed").notNull(),
    pointsValue: numeric("points_value", { precision: 10, scale: 2 }),
    monetaryValue: numeric("monetary_value", { precision: 10, scale: 2 }),
    requestDate: timestamp("request_date", { mode: "string" }),
    status: varchar({ length: 50 }),
    paymentCleared: boolean("payment_cleared"),
    fulfillmentDetails: text("fulfillment_details"),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "redemption_request_user_id_fkey",
    }),
  ]
);
export const transaction = pgTable(
  "transaction",
  {
    transactionId: serial("transaction_id").notNull(),
    userId: integer("user_id").notNull(),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(),
    pointsAmount: integer("points_amount").notNull(),
    transactionDate: timestamp("transaction_date", { mode: "string" }),
    referenceId: integer("reference_id"),
    referenceTable: varchar("reference_table", { length: 50 }),
    description: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "transaction_user_id_fkey",
    }),
  ]
);

export const navisionRetailMaster = pgTable("navision_retail_master", {
  no: varchar("No", { length: 20 }).primaryKey().notNull(),
  name: varchar("Name", { length: 100 }),
  address: varchar("Address", { length: 100 }),
  address2: varchar("Address_2", { length: 100 }),
  city: varchar("City", { length: 50 }),
  postCode: varchar("Post_Code", { length: 20 }),
  stateCode: varchar("State_Code", { length: 10 }),
  countryRegionCode: varchar("Country_Region_Code", { length: 10 }),
  whatsappNo: varchar("Whatsapp_No", { length: 15 }),
  whatsappMobileNumber: varchar("Whatsapp_Mobile_Number", { length: 15 }),
  pANNo: varchar("P_A_N_No", { length: 20 }),
  gstRegistrationNo: varchar("GST_Registration_No", { length: 20 }),
  beatName: varchar("Beat_Name", { length: 50 }),
  salesAgentCustomer: varchar("Sales_Agent_Customer", { length: 20 }),
  pointClaimCustomerType: varchar("Point_Claim_Customer_Type", { length: 50 }),
  ogs: boolean("OGS"),
  gujarat: boolean("Gujarat"),
  etag: varchar("ETag", { length: 100 }),
  createdAt: timestamp("CreatedAt", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

export const navisionCustomerMaster = pgTable("navision_customer_master", {
  no: varchar("No", { length: 20 }).primaryKey().notNull(),
  name: varchar("Name", { length: 100 }),
  address: varchar("Address", { length: 100 }),
  address2: varchar("Address_2", { length: 100 }),
  city: varchar("City", { length: 50 }),
  postCode: varchar("Post_Code", { length: 20 }),
  stateCode: varchar("State_Code", { length: 10 }),
  countryRegionCode: varchar("Country_Region_Code", { length: 10 }),
  whatsappNo1: varchar("Whatsapp_No_1", { length: 15 }),
  whatsappNo2: varchar("Whatsapp_No_2", { length: 15 }),
  pANNo: varchar("P_A_N_No", { length: 20 }),
  gstRegistrationNo: varchar("GST_Registration_No", { length: 20 }),
  salesAgent: varchar("Sales_Agent", { length: 20 }),
  salesAgentName: varchar("Sales_Agent_Name", { length: 100 }),
  salespersonCode: varchar("Salesperson_Code", { length: 20 }),
  etag: varchar("ETag", { length: 100 }),
  createdAt: timestamp("CreatedAt", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

export const navisionVendorMaster = pgTable("navision_vendor_master", {
  no: varchar("No", { length: 20 }).primaryKey().notNull(),
  name: varchar("Name", { length: 100 }),
  address: varchar("Address", { length: 100 }),
  address2: varchar("Address_2", { length: 100 }),
  city: varchar("City", { length: 50 }),
  postCode: varchar("Post_Code", { length: 20 }),
  stateCode: varchar("State_Code", { length: 10 }),
  countryRegionCode: varchar("Country_Region_Code", { length: 10 }),
  whatsappNo: varchar("Whatsapp_No", { length: 15 }),
  whatsappMobileNumber: varchar("Whatsapp_Mobile_Number", { length: 15 }),
  pANNo: varchar("P_A_N_No", { length: 20 }),
  gstRegistrationNo: varchar("GST_Registration_No", { length: 20 }),
  beatName: varchar("Beat_Name", { length: 50 }),
  salesAgentCustomer: varchar("Sales_Agent_Customer", { length: 20 }),
  pointClaimCustomerType: varchar("Point_Claim_Customer_Type", { length: 50 }),
  ogs: boolean("OGS"),
  gujarat: boolean("Gujarat"),
  etag: varchar("ETag", { length: 100 }),
  createdAt: timestamp("CreatedAt", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

export const salesperson = pgTable(
  "salesperson",
  {
    salespersonId: serial("salesperson_id").notNull(),
    userId: integer("user_id").notNull(),
    salespersonName: varchar("salesperson_name", { length: 255 }).notNull(),
    distributorId: integer("distributor_id"),
    navisionId: varchar("navision_id", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "salesperson_user_id_fkey",
    }),
    foreignKey({
      columns: [table.distributorId],
      foreignColumns: [distributor.distributorId],
      name: "salesperson_distributor_id_fkey",
    }),
  ]
);

export const notificationLog = pgTable(
  "notification_log",
  {
    logId: serial("log_id").notNull(),
    userId: integer("user_id").notNull(),
    templateId: integer("template_id"),
    channelUsed: varchar("channel_used", { length: 50 }).notNull(),
    messageContent: text("message_content").notNull(),
    sentStatus: varchar("sent_status", { length: 50 }).notNull(),
    sentAt: timestamp("sent_at", { mode: "string" }),
    responseData: text("response_data"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userMaster.userId],
      name: "notification_log_user_id_fkey",
    }),
  ]
);

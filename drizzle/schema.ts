import { pgTable, unique, varchar, boolean, integer, numeric, timestamp, text, serial, json, foreignKey, jsonb, date, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const salesPointsClaimTransfer = pgTable("sales_points_claim_transfer", {
	documentNo: varchar("document_no", { length: 50 }),
	isMaster: boolean("is_master"),
	lineNo: integer("line_no"),
	entryType: varchar("entry_type", { length: 50 }),
	lineType: varchar("line_type", { length: 50 }),
	customerNo: varchar("customer_no", { length: 50 }),
	customerName: varchar("customer_name", { length: 100 }),
	agentCode: varchar("agent_code", { length: 50 }),
	agentName: varchar("agent_name", { length: 100 }),
	retailerNo: varchar("retailer_no", { length: 50 }),
	retailerName: varchar("retailer_name", { length: 100 }),
	notifyCustomer: varchar("notify_customer", { length: 50 }),
	notifyCustomerName: varchar("notify_customer_name", { length: 100 }),
	salesPersonCode: varchar("sales_person_code", { length: 50 }),
	customerPostingGroup: varchar("customer_posting_group", { length: 50 }),
	status: varchar({ length: 20 }),
	scheme: varchar({ length: 50 }),
	salesPoint: varchar("sales_point", { length: 10 }),
	quantity: numeric({ precision: 20, scale:  2 }),
	qualityDesc: varchar("quality_desc", { length: 50 }),
	multiplier: numeric({ precision: 20, scale:  2 }),
	etag: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	docLineNo: text("doc_line_no").notNull(),
}, (table) => [
	unique("document_line_no").on(table.docLineNo),
]);

export const salesPointLedgerEntry = pgTable("sales_point_ledger_entry", {
	entryNo: integer("entry_no"),
	documentType: varchar("document_type", { length: 50 }),
	documentNo: varchar("document_no", { length: 50 }),
	customerNo: varchar("customer_no", { length: 50 }),
	customerName: varchar("customer_name", { length: 100 }),
	notifyCustomerNo: varchar("notify_customer_no", { length: 50 }),
	notifyCustomerName: varchar("notify_customer_name", { length: 100 }),
	agentCode: varchar("agent_code", { length: 50 }),
	agentName: varchar("agent_name", { length: 100 }),
	retailerNo: varchar("retailer_no", { length: 50 }),
	retailerName: varchar("retailer_name", { length: 100 }),
	scheme: varchar({ length: 50 }),
	salesPoints: numeric("sales_points"),
	customerIsAgent: boolean("customer_is_agent"),
	etag: varchar({ length: 100 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	quantity: numeric(),
	itemGroup: text("item_group"),
}, (table) => [
	unique("sales_point_ledger_entry_entry_no_key").on(table.entryNo),
]);

export const navisionNotifyCustomer = pgTable("navision_notify_customer", {
	no: varchar({ length: 50 }),
	name: varchar({ length: 100 }),
	address: varchar({ length: 255 }),
	address2: varchar("address_2", { length: 255 }),
	city: varchar({ length: 100 }),
	postCode: varchar("post_code", { length: 20 }),
	stateCode: varchar("state_code", { length: 50 }),
	countryRegionCode: varchar("country_region_code", { length: 50 }),
	whatsappNo: varchar("whatsapp_no", { length: 20 }),
	whatsappNo2: varchar("whatsapp_no_2", { length: 20 }),
	salesAgent: varchar("sales_agent", { length: 50 }),
	salesAgentName: varchar("sales_agent_name", { length: 100 }),
	salesPerson: varchar("sales_person", { length: 50 }),
	agentCodeVisibility: boolean("agent_code_visibility"),
	pANNo: varchar("p_a_n_no", { length: 50 }),
	gstRegistrationNo: varchar("gst_registration_no", { length: 50 }),
	etag: varchar({ length: 500 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	onboarded: boolean().default(false).notNull(),
	onboardedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("navision_notify_customer_no_key").on(table.no),
]);

export const schemedetails = pgTable("schemedetails", {
	id: serial().primaryKey().notNull(),
	schemeId: integer("scheme_id").notNull(),
	groupName: text("group_name").notNull(),
	multiplier: numeric().notNull(),
	uniqueId: text("unique_id"),
});

export const apiResponseLogs = pgTable("api_response_logs", {
	id: serial().primaryKey().notNull(),
	refNo: text("ref_no"),
	apiUrl: text("api_url"),
	apiResponse: json("api_response"),
	payload: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const navisionSalespersonList = pgTable("navision_salesperson_list", {
	code: varchar({ length: 50 }),
	name: varchar({ length: 100 }),
	address: varchar({ length: 255 }),
	address2: varchar("address_2", { length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	postCode: varchar("post_code", { length: 20 }),
	whatsappMobileNumber: varchar("whatsapp_mobile_number", { length: 20 }),
	etag: varchar({ length: 500 }),
	onboarded: boolean().default(false).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	onboardedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("navision_salesperson_list_whatsapp_mobile_number_key").on(table.whatsappMobileNumber),
]);

export const retailerRewardPointEntry = pgTable("retailer_reward_point_entry", {
	entryNo: integer("entry_no"),
	entryDate: timestamp("entry_date", { mode: 'string' }),
	purchaseFromVendorNo: varchar("purchase_from_vendor_no", { length: 50 }),
	status: varchar({ length: 50 }),
	scheme: varchar({ length: 50 }),
	agentCode: varchar("agent_code", { length: 50 }),
	agentName: varchar("agent_name", { length: 100 }),
	partyNo: varchar("party_no", { length: 50 }),
	partyName: varchar("party_name", { length: 100 }),
	documentNo: varchar("document_no", { length: 50 }),
	whatsappNo: varchar("whatsapp_no", { length: 20 }),
	whatsappNo2: varchar("whatsapp_no_2", { length: 20 }),
	courierName: varchar("courier_name", { length: 50 }),
	giftArticleName: varchar("gift_article_name", { length: 100 }),
	qty: integer(),
	etag: varchar({ length: 100 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("retailer_reward_point_entry_entry_no_key").on(table.entryNo),
]);

export const appSettings = pgTable("app_settings", {
	settingId: serial("setting_id").primaryKey().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const contentManagement = pgTable("content_management", {
	contentId: serial("content_id").primaryKey().notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	content: text(),
	imagePdfUrl: varchar("image_pdf_url", { length: 255 }),
	lastUpdatedAt: timestamp("last_updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	preview: text(),
});

export const mediaLinks = pgTable("media_links", {
	linkId: serial("link_id").primaryKey().notNull(),
	platformName: varchar("platform_name", { length: 100 }).notNull(),
	linkUrl: varchar("link_url", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("media_links_platform_name_key").on(table.platformName),
]);

export const gifts = pgTable("gifts", {
	giftId: integer("gift_id").primaryKey().generatedAlwaysAsIdentity({ name: "gifts_gift_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	giftName: text("gift_name"),
	imageUrl: text("image_url"),
	uniqueId: text("unique_id"),
	isActive: boolean("is_active"),
	value: integer(),
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
	etag: varchar("ETag", { length: 500 }),
	createdAt: timestamp("CreatedAt", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	onboarded: boolean("Onboarded").default(false),
	onboardedAt: timestamp("OnboardedAt", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("vendor_unique").on(table.no),
]);

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
	etag: varchar("ETag", { length: 500 }),
	createdAt: timestamp("CreatedAt", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	onboarded: boolean("Onboarded").default(false),
	onboardedAt: timestamp("OnboardedAt", { mode: 'string' }),
}, (table) => [
	unique("customer_unique").on(table.no),
]);

export const pointAllocationLog = pgTable("point_allocation_log", {
	allocationId: serial("allocation_id").primaryKey().notNull(),
	invoiceId: integer("invoice_id"),
	sourceUserId: integer("source_user_id"),
	targetUserId: integer("target_user_id").notNull(),
	pointsAllocated: integer("points_allocated").notNull(),
	allocationDate: timestamp("allocation_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	allocationMethod: varchar("allocation_method", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('success'),
	adminApprovedBy: integer("admin_approved_by"),
	adminApprovalDate: timestamp("admin_approval_date", { mode: 'string' }),
	description: text(),
	details: json().array(),
	documentNo: text("document_no"),
}, (table) => [
	foreignKey({
			columns: [table.adminApprovedBy],
			foreignColumns: [userMaster.userId],
			name: "point_allocation_log_admin_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.sourceUserId],
			foreignColumns: [userMaster.userId],
			name: "point_allocation_log_source_user_id_fkey"
		}),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [userMaster.userId],
			name: "point_allocation_log_target_user_id_fkey"
		}),
]);

export const permissions = pgTable("permissions", {
	permissionId: serial("permission_id").primaryKey().notNull(),
	permissionName: varchar("permission_name", { length: 100 }).notNull(),
}, (table) => [
	unique("permissions_permission_name_key").on(table.permissionName),
]);

export const redemptionRequest = pgTable("redemption_request", {
	requestId: serial("request_id").primaryKey().notNull(),
	redemptionId: varchar("redemption_id", { length: 100 }).notNull(),
	userId: integer("user_id"),
	distributorId: integer("distributor_id"),
	method: varchar({ length: 50 }).notNull(),
	monetaryValue: numeric("monetary_value", { precision: 10, scale:  2 }),
	requestDate: timestamp("request_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	status: varchar({ length: 100 }).default('pending'),
	paymentCleared: boolean("payment_cleared").default(false),
	fulfillmentDetails: text("fulfillment_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	deliveryAddress: text("delivery_address"),
	navisionId: text("navision_id"),
	retailerCode: text("retailer_code"),
	distributorCode: text("distributor_code"),
	documentNo: text("document_no"),
	salesPersonCode: text("sales_person_code"),
	createdBy: text("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "redemption_request_user_id_fkey"
		}),
	unique("entry_no_navision_id").on(table.navisionId),
]);

export const transaction = pgTable("transaction", {
	transactionId: serial("transaction_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	transactionType: varchar("transaction_type", { length: 50 }).notNull(),
	pointsAmount: integer("points_amount").notNull(),
	transactionDate: timestamp("transaction_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	referenceId: integer("reference_id"),
	referenceTable: varchar("reference_table", { length: 50 }),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "transaction_user_id_fkey"
		}),
]);

export const onboardingLogs = pgTable("onboarding_logs", {
	id: serial().primaryKey().notNull(),
	refNo: text("ref_no").notNull(),
	result: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const schemes = pgTable("schemes", {
	schemeId: integer("scheme_id").primaryKey().notNull(),
	schemeName: text("scheme_name").notNull(),
	schemeResourcee: text("scheme_resourcee").notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	applicableRoles: integer("applicable_roles").array(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	schemePreview: text("scheme_preview"),
});

export const distributor = pgTable("distributor", {
	distributorId: serial("distributor_id").primaryKey().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	totalPoints: integer("total_points").default(0),
	balancePoints: integer("balance_points").default(0),
	consumedPoints: integer("consumed_points").default(0),
	salesPersonCode: text("sales_person_code"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "distributor_user_id_fkey"
		}),
	unique("distributor_user_id_key").on(table.userId),
	unique("distributor_navision_id_key").on(table.navisionId),
]);

export const userRoles = pgTable("user_roles", {
	roleId: serial("role_id").primaryKey().notNull(),
	roleName: varchar("role_name", { length: 50 }).notNull(),
}, (table) => [
	unique("user_roles_role_name_key").on(table.roleName),
]);

export const notificationLog = pgTable("notification_log", {
	logId: serial("log_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	templateId: integer("template_id"),
	channelUsed: varchar("channel_used", { length: 50 }).notNull(),
	messageContent: text("message_content").notNull(),
	sentStatus: varchar("sent_status", { length: 50 }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	responseData: text("response_data"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "notification_log_user_id_fkey"
		}),
]);

export const redemptionRewardLines = pgTable("redemption_reward_lines", {
	lineId: serial("line_id").primaryKey().notNull(),
	requestId: integer("request_id").notNull(),
	redemptionId: varchar("redemption_id", { length: 100 }).notNull(),
	rewardId: integer("reward_id").notNull(),
	pointsValue: numeric("points_value", { precision: 10, scale:  2 }).notNull(),
	pointsRedeemed: numeric("points_redeemed", { precision: 10, scale:  2 }).notNull(),
	quantity: integer().notNull(),
	reward: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdBy: text("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.requestId],
			foreignColumns: [redemptionRequest.requestId],
			name: "redemption_reward_lines_request_id_fkey"
		}).onDelete("cascade"),
]);

export const retailer = pgTable("retailer", {
	retailerId: serial("retailer_id").primaryKey().notNull(),
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
	onboardingStatus: varchar("onboarding_status", { length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	totalPoints: numeric("total_points", { precision: 15, scale:  2 }).default('0'),
	balancePoints: numeric("balance_points", { precision: 15, scale:  2 }).default('0'),
	consumedPoints: numeric("consumed_points", { precision: 15, scale:  2 }).default('0'),
	homeAddress: text("home_address"),
	workAddress: text("work_address"),
	beatName: text("beat_name"),
	retailerCode: text("retailer_code"),
	salesAgentCodee: text("sales_agent_codee"),
	salesAgentNamee: text("sales_agent_namee"),
	salesAgentId: integer("sales_agent_id"),
}, (table) => [
	foreignKey({
			columns: [table.distributorId],
			foreignColumns: [distributor.distributorId],
			name: "Retailer_distributor_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "Retailer_user_id_fkey"
		}),
	unique("Retailer_user_id_key").on(table.userId),
]);

export const userMaster = pgTable("user_master", {
	userId: serial("user_id").primaryKey().notNull(),
	username: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	password: varchar({ length: 255 }),
	mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
	secondaryMobileNumber: varchar("secondary_mobile_number", { length: 20 }),
	userType: varchar("user_type", { length: 50 }).notNull(),
	roleId: integer("role_id"),
	isActive: boolean("is_active").default(true),
	bankAccountName: varchar("bank_account_name", { length: 255 }),
	accountNumber: varchar("account_number", { length: 50 }),
	ifscCode: varchar("ifsc_code", { length: 20 }),
	upi: varchar({ length: 100 }),
	totalPoints: numeric("total_points", { precision: 15, scale:  2 }).default('0'),
	balancePoints: numeric("balance_points", { precision: 15, scale:  2 }).default('0'),
	redeemedPoints: numeric("redeemed_points", { precision: 15, scale:  2 }).default('0'),
	fcmToken: text("fcm_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	deviceDetails: jsonb("device_details"),
	profileImage: text("profile_image"),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [userRoles.roleId],
			name: "user_master_role_id_fkey"
		}),
	unique("user_master_email_key").on(table.email),
	unique("user_master_mobile_number_key").on(table.mobileNumber),
	unique("user_master_secondary_mobile_number_key").on(table.secondaryMobileNumber),
]);

export const navisionRetailMaster = pgTable("navision_retail_master", {
	no: varchar("No", { length: 20 }).primaryKey().notNull(),
	address2: varchar("Address_2", { length: 100 }),
	city: varchar("City", { length: 50 }),
	countryRegionCode: varchar("Country_Region_Code", { length: 10 }),
	whatsappNo: varchar("Whatsapp_No", { length: 15 }),
	pANNo: varchar("P_A_N_No", { length: 20 }),
	gstRegistrationNo: varchar("GST_Registration_No", { length: 30 }),
	beatName: varchar("Beat_Name", { length: 50 }),
	gujarat: boolean("Gujarat"),
	etag: varchar("ETag", { length: 500 }),
	createdAt: timestamp("CreatedAt", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	onboarded: boolean("Onboarded").default(false),
	onboardedAt: timestamp("OnboardedAt", { mode: 'string' }),
	shopName: varchar("Shop_Name", { length: 100 }),
	shopAddress: varchar("Shop_Address", { length: 100 }),
	pinCode: varchar("Pin_Code", { length: 20 }),
	state: varchar("State", { length: 30 }),
	whatsappNo2: varchar("Whatsapp_No_2", { length: 15 }),
	agentName: varchar("Agent_Name", { length: 100 }),
	supplyFrom: varchar("Supply_From", { length: 50 }),
	aadhaarNo: varchar("Aadhaar_No", { length: 20 }),
	salesPersonCode: varchar("Sales_Person_Code", { length: 20 }),
	salesPersonName: varchar("Sales_Person_Name", { length: 100 }),
	agentCode: varchar("Agent_Code", { length: 20 }),
}, (table) => [
	unique("retail_unique").on(table.no),
]);

export const salesperson = pgTable("salesperson", {
	salespersonId: serial("salesperson_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	salespersonName: varchar("salesperson_name", { length: 255 }).notNull(),
	distributorId: integer("distributor_id"),
	navisionId: varchar("navision_id", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	address: text(),
	address2: text("address_2"),
	city: text(),
	state: text(),
	pinCode: text("pin_code"),
	mobileNumber: text("mobile_number"),
}, (table) => [
	foreignKey({
			columns: [table.distributorId],
			foreignColumns: [distributor.distributorId],
			name: "salesperson_distributor_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userMaster.userId],
			name: "salesperson_user_id_fkey"
		}),
	unique("salesperson_user_id_key").on(table.userId),
	unique("salesperson_navision_id_key").on(table.navisionId),
]);

export const rolePermissions = pgTable("role_permissions", {
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.permissionId],
			name: "role_permissions_permission_id_fkey"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [userRoles.roleId],
			name: "role_permissions_role_id_fkey"
		}),
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_pkey"}),
]);

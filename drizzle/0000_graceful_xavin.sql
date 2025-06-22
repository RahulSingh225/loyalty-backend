-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "distributor" (
	"distributor_id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"distributor_name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone_number" varchar(20),
	"email" varchar(255),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"zip_code" varchar(20),
	"gst_number" varchar(15),
	"navision_id" varchar(100),
	"created_at" timestamp,
	"updated_at" timestamp,
	"total_points" integer,
	"balance_points" integer,
	"consumed_points" integer
);
--> statement-breakpoint
CREATE TABLE "Retailer" (
	"retailer_id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"distributor_id" integer,
	"shop_name" varchar(255) NOT NULL,
	"shop_address" text,
	"pin_code" varchar(20),
	"city" varchar(100),
	"state" varchar(100),
	"whatsapp_no" varchar(20),
	"pan_no" varchar(20),
	"gst_registration_no" varchar(50),
	"aadhaar_card_no" varchar(20),
	"navision_id" varchar(100),
	"onboarding_status" varchar(50),
	"created_at" timestamp,
	"updated_at" timestamp,
	"total_points" integer,
	"balance_points" integer,
	"consumed_points" integer
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"role_id" serial NOT NULL,
	"role_name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"permission_id" serial NOT NULL,
	"permission_name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_master" (
	"user_id" serial NOT NULL,
	"username" varchar(255),
	"email" varchar(255),
	"password" varchar(255),
	"mobile_number" varchar(20) NOT NULL,
	"secondary_mobile_number" varchar(20) NOT NULL,
	"user_type" varchar(50) NOT NULL,
	"role_id" integer,
	"is_active" boolean,
	"bank_account_name" varchar(255),
	"account_number" varchar(50),
	"ifsc_code" varchar(20),
	"upi" varchar(100),
	"total_points" integer,
	"balance_points" integer,
	"redeemed_points" integer,
	"fcm_token" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"setting_id" serial NOT NULL,
	"app_name" varchar(255) NOT NULL,
	"short_description" varchar(255),
	"company_logo_url" varchar(255),
	"theme_color" varchar(50),
	"getting_started_image_url" varchar(255),
	"primary_color" varchar(20),
	"secondary_color" varchar(20),
	"language" varchar(50),
	"font" varchar(50),
	"banner_image_url" varchar(255),
	"home_image_url" varchar(255),
	"landing_image_url" varchar(255),
	"resource_base_url" varchar(255),
	"api_base_url" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "point_allocation_log" (
	"allocation_id" serial NOT NULL,
	"invoice_id" integer NOT NULL,
	"source_user_id" integer,
	"target_user_id" integer NOT NULL,
	"points_allocated" integer NOT NULL,
	"allocation_date" timestamp,
	"allocation_method" varchar(50) NOT NULL,
	"status" varchar(50),
	"admin_approved_by" integer,
	"admin_approval_date" timestamp,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "content_management" (
	"content_id" serial NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content" text,
	"image_pdf_url" varchar(255),
	"last_updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "media_links" (
	"link_id" serial NOT NULL,
	"platform_name" varchar(100) NOT NULL,
	"link_url" varchar(255) NOT NULL,
	"is_active" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "redemption_request" (
	"request_id" serial NOT NULL,
	"redemption_id" varchar(100) NOT NULL,
	"user_id" integer NOT NULL,
	"distributor_id" integer,
	"reward_id" integer NOT NULL,
	"method" varchar(50) NOT NULL,
	"points_redeemed" integer NOT NULL,
	"points_value" numeric(10, 2),
	"monetary_value" numeric(10, 2),
	"request_date" timestamp,
	"status" varchar(50),
	"payment_cleared" boolean,
	"fulfillment_details" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"transaction_id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"points_amount" integer NOT NULL,
	"transaction_date" timestamp,
	"reference_id" integer,
	"reference_table" varchar(50),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "salesperson" (
	"salesperson_id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"salesperson_name" varchar(255) NOT NULL,
	"distributor_id" integer,
	"navision_id" varchar(100),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"log_id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"template_id" integer,
	"channel_used" varchar(50) NOT NULL,
	"message_content" text NOT NULL,
	"sent_status" varchar(50) NOT NULL,
	"sent_at" timestamp,
	"response_data" text
);
--> statement-breakpoint
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Retailer" ADD CONSTRAINT "Retailer_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributor"("distributor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("role_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("permission_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("role_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_allocation_log" ADD CONSTRAINT "point_allocation_log_source_user_id_fkey" FOREIGN KEY ("source_user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_allocation_log" ADD CONSTRAINT "point_allocation_log_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_allocation_log" ADD CONSTRAINT "point_allocation_log_admin_approved_by_fkey" FOREIGN KEY ("admin_approved_by") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_request" ADD CONSTRAINT "redemption_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salesperson" ADD CONSTRAINT "salesperson_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salesperson" ADD CONSTRAINT "salesperson_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributor"("distributor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_master"("user_id") ON DELETE no action ON UPDATE no action;
*/
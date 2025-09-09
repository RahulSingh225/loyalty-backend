import { relations } from "drizzle-orm/relations";
import { userMaster, distributor, pointAllocationLog, redemptionRequest, transaction, notificationLog, redemptionRewardLines, retailer, userRoles, salesperson, permissions, rolePermissions } from "./schema";

export const distributorRelations = relations(distributor, ({one, many}) => ({
	userMaster: one(userMaster, {
		fields: [distributor.userId],
		references: [userMaster.userId]
	}),
	retailers: many(retailer),
	salespeople: many(salesperson),
}));

export const userMasterRelations = relations(userMaster, ({one, many}) => ({
	distributors: many(distributor),
	pointAllocationLogs_adminApprovedBy: many(pointAllocationLog, {
		relationName: "pointAllocationLog_adminApprovedBy_userMaster_userId"
	}),
	pointAllocationLogs_sourceUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_sourceUserId_userMaster_userId"
	}),
	pointAllocationLogs_targetUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_targetUserId_userMaster_userId"
	}),
	redemptionRequests: many(redemptionRequest),
	transactions: many(transaction),
	notificationLogs: many(notificationLog),
	retailers: many(retailer),
	userRole: one(userRoles, {
		fields: [userMaster.roleId],
		references: [userRoles.roleId]
	}),
	salespeople: many(salesperson),
}));

export const pointAllocationLogRelations = relations(pointAllocationLog, ({one}) => ({
	userMaster_adminApprovedBy: one(userMaster, {
		fields: [pointAllocationLog.adminApprovedBy],
		references: [userMaster.userId],
		relationName: "pointAllocationLog_adminApprovedBy_userMaster_userId"
	}),
	userMaster_sourceUserId: one(userMaster, {
		fields: [pointAllocationLog.sourceUserId],
		references: [userMaster.userId],
		relationName: "pointAllocationLog_sourceUserId_userMaster_userId"
	}),
	userMaster_targetUserId: one(userMaster, {
		fields: [pointAllocationLog.targetUserId],
		references: [userMaster.userId],
		relationName: "pointAllocationLog_targetUserId_userMaster_userId"
	}),
}));

export const redemptionRequestRelations = relations(redemptionRequest, ({one, many}) => ({
	userMaster: one(userMaster, {
		fields: [redemptionRequest.userId],
		references: [userMaster.userId]
	}),
	redemptionRewardLines: many(redemptionRewardLines),
}));

export const transactionRelations = relations(transaction, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [transaction.userId],
		references: [userMaster.userId]
	}),
}));

export const notificationLogRelations = relations(notificationLog, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [notificationLog.userId],
		references: [userMaster.userId]
	}),
}));

export const redemptionRewardLinesRelations = relations(redemptionRewardLines, ({one}) => ({
	redemptionRequest: one(redemptionRequest, {
		fields: [redemptionRewardLines.requestId],
		references: [redemptionRequest.requestId]
	}),
}));

export const retailerRelations = relations(retailer, ({one}) => ({
	distributor: one(distributor, {
		fields: [retailer.distributorId],
		references: [distributor.distributorId]
	}),
	userMaster: one(userMaster, {
		fields: [retailer.userId],
		references: [userMaster.userId]
	}),
}));

export const userRolesRelations = relations(userRoles, ({many}) => ({
	userMasters: many(userMaster),
	rolePermissions: many(rolePermissions),
}));

export const salespersonRelations = relations(salesperson, ({one}) => ({
	distributor: one(distributor, {
		fields: [salesperson.distributorId],
		references: [distributor.distributorId]
	}),
	userMaster: one(userMaster, {
		fields: [salesperson.userId],
		references: [userMaster.userId]
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.permissionId]
	}),
	userRole: one(userRoles, {
		fields: [rolePermissions.roleId],
		references: [userRoles.roleId]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));
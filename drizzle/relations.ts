import { relations } from "drizzle-orm/relations";
import { userMaster, distributor, redemptionRequest, redemptionRewardLines, pointAllocationLog, transaction, salesperson, retailer, userRoles, notificationLog, permissions, rolePermissions } from "./schema";

export const distributorRelations = relations(distributor, ({one, many}) => ({
	userMaster: one(userMaster, {
		fields: [distributor.userId],
		references: [userMaster.userId]
	}),
	salespeople: many(salesperson),
	retailers: many(retailer),
}));

export const userMasterRelations = relations(userMaster, ({one, many}) => ({
	distributors: many(distributor),
	redemptionRequests: many(redemptionRequest),
	pointAllocationLogs_adminApprovedBy: many(pointAllocationLog, {
		relationName: "pointAllocationLog_adminApprovedBy_userMaster_userId"
	}),
	pointAllocationLogs_sourceUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_sourceUserId_userMaster_userId"
	}),
	pointAllocationLogs_targetUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_targetUserId_userMaster_userId"
	}),
	transactions: many(transaction),
	salespeople: many(salesperson),
	retailers: many(retailer),
	userRole: one(userRoles, {
		fields: [userMaster.roleId],
		references: [userRoles.roleId]
	}),
	notificationLogs: many(notificationLog),
}));

export const redemptionRequestRelations = relations(redemptionRequest, ({one, many}) => ({
	userMaster: one(userMaster, {
		fields: [redemptionRequest.userId],
		references: [userMaster.userId]
	}),
	redemptionRewardLines: many(redemptionRewardLines),
}));

export const redemptionRewardLinesRelations = relations(redemptionRewardLines, ({one}) => ({
	redemptionRequest: one(redemptionRequest, {
		fields: [redemptionRewardLines.requestId],
		references: [redemptionRequest.requestId]
	}),
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

export const transactionRelations = relations(transaction, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [transaction.userId],
		references: [userMaster.userId]
	}),
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

export const notificationLogRelations = relations(notificationLog, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [notificationLog.userId],
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
import { relations } from "drizzle-orm/relations";
import { userMaster, distributor, retailer, userRoles, rolePermissions, permissions, pointAllocationLog, redemptionRequest, transaction, salesperson, notificationLog } from "./schema";

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
	retailers: many(retailer),
	userRole: one(userRoles, {
		fields: [userMaster.roleId],
		references: [userRoles.roleId]
	}),
	pointAllocationLogs_sourceUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_sourceUserId_userMaster_userId"
	}),
	pointAllocationLogs_targetUserId: many(pointAllocationLog, {
		relationName: "pointAllocationLog_targetUserId_userMaster_userId"
	}),
	pointAllocationLogs_adminApprovedBy: many(pointAllocationLog, {
		relationName: "pointAllocationLog_adminApprovedBy_userMaster_userId"
	}),
	redemptionRequests: many(redemptionRequest),
	transactions: many(transaction),
	salespeople: many(salesperson),
	notificationLogs: many(notificationLog),
}));

export const retailerRelations = relations(retailer, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [retailer.userId],
		references: [userMaster.userId]
	}),
	distributor: one(distributor, {
		fields: [retailer.distributorId],
		references: [distributor.distributorId]
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	userRole: one(userRoles, {
		fields: [rolePermissions.roleId],
		references: [userRoles.roleId]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.permissionId]
	}),
}));

export const userRolesRelations = relations(userRoles, ({many}) => ({
	rolePermissions: many(rolePermissions),
	userMasters: many(userMaster),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const pointAllocationLogRelations = relations(pointAllocationLog, ({one}) => ({
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
	userMaster_adminApprovedBy: one(userMaster, {
		fields: [pointAllocationLog.adminApprovedBy],
		references: [userMaster.userId],
		relationName: "pointAllocationLog_adminApprovedBy_userMaster_userId"
	}),
}));

export const redemptionRequestRelations = relations(redemptionRequest, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [redemptionRequest.userId],
		references: [userMaster.userId]
	}),
}));

export const transactionRelations = relations(transaction, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [transaction.userId],
		references: [userMaster.userId]
	}),
}));

export const salespersonRelations = relations(salesperson, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [salesperson.userId],
		references: [userMaster.userId]
	}),
	distributor: one(distributor, {
		fields: [salesperson.distributorId],
		references: [distributor.distributorId]
	}),
}));

export const notificationLogRelations = relations(notificationLog, ({one}) => ({
	userMaster: one(userMaster, {
		fields: [notificationLog.userId],
		references: [userMaster.userId]
	}),
}));
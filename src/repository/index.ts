import UserRepository from "./user.repository";
import EarningRepository from "./earning.repository";
import RedemptionRepository from "./redemption.repository";
import SchemeRepository from "./scheme.repository";
import ContentRepository from "./content.repository";
import TransactionRepository from "./transaction.repository";

export const userRepository = new UserRepository();
export const earningRepository = new EarningRepository();
export const redemptionRepository = new RedemptionRepository();
export const schemeRepository = new SchemeRepository();
export const contentRepository = new ContentRepository();
export const transactionRepository = new TransactionRepository();


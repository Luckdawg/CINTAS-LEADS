import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Accounts table - stores business lead information
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  // Deterministic UUID for external references
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  
  // Company information
  companyName: varchar("companyName", { length: 500 }).notNull(),
  address: text("address").notNull(),
  county: varchar("county", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }).default("GA").notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  
  // Contact information
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  
  // Business classification
  industry: varchar("industry", { length: 200 }),
  // Product lines - comma-separated list of services
  productLines: text("productLines"), // e.g., "HearingTesting,Dosimetry,FirstAidCabinets,AED,Eyewash,Training,PPE"
  
  // Employee and revenue data
  employeeCountEstimated: int("employeeCountEstimated"),
  employeeEstimateConfidence: mysqlEnum("employeeEstimateConfidence", ["High", "Medium", "Low"]),
  revenueEstimate: decimal("revenueEstimate", { precision: 15, scale: 2 }),
  
  // LinkedIn data
  linkedInCompanyUrl: varchar("linkedInCompanyUrl", { length: 500 }),
  linkedInEmployeeSize: varchar("linkedInEmployeeSize", { length: 50 }),
  
  // Google Maps data
  googleMapsPlaceId: varchar("googleMapsPlaceId", { length: 200 }),
  googleMapsUrl: varchar("googleMapsUrl", { length: 500 }),
  googleMapsRating: decimal("googleMapsRating", { precision: 3, scale: 2 }),
  googleMapsReviewCount: int("googleMapsReviewCount"),
  
  // Deduplication flags
  possibleDuplicate: boolean("possibleDuplicate").default(false).notNull(),
  duplicateGroupId: varchar("duplicateGroupId", { length: 36 }),
  
  // Metadata
  dataSource: varchar("dataSource", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  countyIdx: index("county_idx").on(table.county),
  zipCodeIdx: index("zip_code_idx").on(table.zipCode),
  duplicateGroupIdx: index("duplicate_group_idx").on(table.duplicateGroupId),
}));

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Contacts table - stores decision maker information
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  
  // Contact information
  contactName: varchar("contactName", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  roleType: mysqlEnum("roleType", ["Primary", "Secondary"]).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  linkedInUrl: varchar("linkedInUrl", { length: 500 }),
  
  // Ranking and confidence
  safetyDecisionAuthority: int("safetyDecisionAuthority").default(0).notNull(), // Higher = more authority
  
  // Metadata
  dataSource: varchar("dataSource", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
}));

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Source metadata table - tracks data provenance and collection details
 */
export const sourceMetadata = mysqlTable("sourceMetadata", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  
  // Source information
  sourceName: varchar("sourceName", { length: 100 }).notNull(), // e.g., "GoogleMaps", "LinkedIn", "Outscraper"
  sourceUrl: text("sourceUrl"),
  collectionMethod: varchar("collectionMethod", { length: 100 }), // e.g., "API", "Scraper"
  
  // Collection details
  collectedAt: timestamp("collectedAt").defaultNow().notNull(),
  queryUsed: text("queryUsed"),
  rawData: text("rawData"), // JSON string of raw API response
  
  // Quality metrics
  dataQualityScore: int("dataQualityScore"), // 0-100
  fieldsPopulated: int("fieldsPopulated"),
  totalFields: int("totalFields"),
}, (table) => ({
  accountIdx: index("source_account_idx").on(table.accountId),
  sourceIdx: index("source_name_idx").on(table.sourceName),
}));

export type SourceMetadata = typeof sourceMetadata.$inferSelect;
export type InsertSourceMetadata = typeof sourceMetadata.$inferInsert;

/**
 * Duplicate analysis table - stores deduplication analysis results
 */
export const duplicateAnalysis = mysqlTable("duplicateAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  // Duplicate group information
  duplicateGroupId: varchar("duplicateGroupId", { length: 36 }).notNull(),
  accountIdA: int("accountIdA").notNull(),
  accountIdB: int("accountIdB").notNull(),
  
  // Similarity metrics
  nameSimilarityScore: decimal("nameSimilarityScore", { precision: 5, scale: 2 }),
  addressSimilarityScore: decimal("addressSimilarityScore", { precision: 5, scale: 2 }),
  overallSimilarityScore: decimal("overallSimilarityScore", { precision: 5, scale: 2 }),
  
  // Match details
  matchReason: text("matchReason"),
  matchedFields: varchar("matchedFields", { length: 500 }), // Comma-separated list
  
  // Analysis metadata
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  algorithmVersion: varchar("algorithmVersion", { length: 20 }).default("1.0").notNull(),
}, (table) => ({
  groupIdx: index("dup_group_idx").on(table.duplicateGroupId),
  accountAIdx: index("dup_account_a_idx").on(table.accountIdA),
  accountBIdx: index("dup_account_b_idx").on(table.accountIdB),
}));

export type DuplicateAnalysis = typeof duplicateAnalysis.$inferSelect;
export type InsertDuplicateAnalysis = typeof duplicateAnalysis.$inferInsert;

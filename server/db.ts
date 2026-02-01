import { eq, and, or, like, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  accounts, 
  contacts, 
  sourceMetadata, 
  duplicateAnalysis,
  InsertAccount,
  InsertContact,
  InsertSourceMetadata,
  InsertDuplicateAnalysis,
  Account,
  Contact
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// ACCOUNTS - Business Lead Management
// ============================================================================

export async function insertAccount(account: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(accounts).values(account);
  return result;
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccountByUuid(uuid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(accounts).where(eq(accounts.uuid, uuid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export interface AccountFilters {
  county?: string;
  safetyVertical?: string;
  industry?: string;
  minEmployees?: number;
  maxEmployees?: number;
  duplicatesOnly?: boolean;
  searchQuery?: string;
}

export async function getAccounts(filters?: AccountFilters, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(accounts);
  const conditions = [];
  
  if (filters?.county) {
    conditions.push(eq(accounts.county, filters.county));
  }
  
  if (filters?.safetyVertical) {
    conditions.push(eq(accounts.safetyVertical, filters.safetyVertical as any));
  }
  
  if (filters?.industry) {
    conditions.push(like(accounts.industry, `%${filters.industry}%`));
  }
  
  if (filters?.minEmployees !== undefined) {
    conditions.push(sql`${accounts.employeeCountEstimated} >= ${filters.minEmployees}`);
  }
  
  if (filters?.maxEmployees !== undefined) {
    conditions.push(sql`${accounts.employeeCountEstimated} <= ${filters.maxEmployees}`);
  }
  
  if (filters?.duplicatesOnly) {
    conditions.push(eq(accounts.possibleDuplicate, true));
  }
  
  if (filters?.searchQuery) {
    conditions.push(
      or(
        like(accounts.companyName, `%${filters.searchQuery}%`),
        like(accounts.address, `%${filters.searchQuery}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query.limit(limit).offset(offset).orderBy(desc(accounts.createdAt));
  return results;
}

export async function getAccountsCount(filters?: AccountFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select({ count: sql<number>`count(*)` }).from(accounts);
  const conditions = [];
  
  if (filters?.county) {
    conditions.push(eq(accounts.county, filters.county));
  }
  
  if (filters?.safetyVertical) {
    conditions.push(eq(accounts.safetyVertical, filters.safetyVertical as any));
  }
  
  if (filters?.industry) {
    conditions.push(like(accounts.industry, `%${filters.industry}%`));
  }
  
  if (filters?.minEmployees !== undefined) {
    conditions.push(sql`${accounts.employeeCountEstimated} >= ${filters.minEmployees}`);
  }
  
  if (filters?.maxEmployees !== undefined) {
    conditions.push(sql`${accounts.employeeCountEstimated} <= ${filters.maxEmployees}`);
  }
  
  if (filters?.duplicatesOnly) {
    conditions.push(eq(accounts.possibleDuplicate, true));
  }
  
  if (filters?.searchQuery) {
    conditions.push(
      or(
        like(accounts.companyName, `%${filters.searchQuery}%`),
        like(accounts.address, `%${filters.searchQuery}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query;
  return result[0]?.count || 0;
}

export async function updateAccount(id: number, updates: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(accounts).set(updates).where(eq(accounts.id, id));
}

// ============================================================================
// CONTACTS - Decision Maker Management
// ============================================================================

export async function insertContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(contact);
  return result;
}

export async function getContactsByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(contacts)
    .where(eq(contacts.accountId, accountId))
    .orderBy(desc(contacts.safetyDecisionAuthority), asc(contacts.roleType));
  
  return result;
}

export async function getAllContactsWithAccounts(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      contact: contacts,
      account: accounts,
    })
    .from(contacts)
    .leftJoin(accounts, eq(contacts.accountId, accounts.id))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(contacts.createdAt));
  
  return result;
}

// ============================================================================
// SOURCE METADATA - Data Provenance Tracking
// ============================================================================

export async function insertSourceMetadata(metadata: InsertSourceMetadata) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sourceMetadata).values(metadata);
  return result;
}

export async function getSourceMetadataByAccountId(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(sourceMetadata)
    .where(eq(sourceMetadata.accountId, accountId))
    .orderBy(desc(sourceMetadata.collectedAt));
  
  return result;
}

// ============================================================================
// DUPLICATE ANALYSIS - Deduplication Management
// ============================================================================

export async function insertDuplicateAnalysis(analysis: InsertDuplicateAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(duplicateAnalysis).values(analysis);
  return result;
}

export async function getDuplicatesByGroupId(groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(duplicateAnalysis)
    .where(eq(duplicateAnalysis.duplicateGroupId, groupId))
    .orderBy(desc(duplicateAnalysis.overallSimilarityScore));
  
  return result;
}

export async function getAllDuplicateGroups() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      duplicateGroupId: duplicateAnalysis.duplicateGroupId,
      count: sql<number>`count(*)`,
    })
    .from(duplicateAnalysis)
    .groupBy(duplicateAnalysis.duplicateGroupId)
    .orderBy(desc(sql`count(*)`));
  
  return result;
}

export async function getDuplicateAnalysisWithAccounts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      analysis: duplicateAnalysis,
      accountA: {
        id: accounts.id,
        companyName: accounts.companyName,
        address: accounts.address,
      },
    })
    .from(duplicateAnalysis)
    .leftJoin(accounts, eq(duplicateAnalysis.accountIdA, accounts.id))
    .orderBy(desc(duplicateAnalysis.overallSimilarityScore));
  
  return result;
}

// ============================================================================
// STATISTICS - Dashboard Metrics
// ============================================================================

export async function getLeadStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const totalLeads = await db.select({ count: sql<number>`count(*)` }).from(accounts);
  
  const duplicateLeads = await db
    .select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(eq(accounts.possibleDuplicate, true));
  
  const byVertical = await db
    .select({
      vertical: accounts.safetyVertical,
      count: sql<number>`count(*)`,
    })
    .from(accounts)
    .groupBy(accounts.safetyVertical);
  
  const byCounty = await db
    .select({
      county: accounts.county,
      count: sql<number>`count(*)`,
    })
    .from(accounts)
    .groupBy(accounts.county)
    .orderBy(desc(sql`count(*)`));
  
  const totalContacts = await db.select({ count: sql<number>`count(*)` }).from(contacts);
  
  const avgContactsPerAccount = await db
    .select({
      avg: sql<number>`avg(contact_count)`,
    })
    .from(
      db
        .select({
          accountId: contacts.accountId,
          contactCount: sql<number>`count(*)`.as('contact_count'),
        })
        .from(contacts)
        .groupBy(contacts.accountId)
        .as('contact_counts')
    );
  
  return {
    totalLeads: totalLeads[0]?.count || 0,
    duplicateLeads: duplicateLeads[0]?.count || 0,
    totalContacts: totalContacts[0]?.count || 0,
    avgContactsPerAccount: Number(avgContactsPerAccount[0]?.avg || 0),
    byVertical,
    byCounty,
  };
}

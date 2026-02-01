import { v4 as uuidv4 } from 'uuid';
import * as db from "./db";
import { InsertDuplicateAnalysis } from "../drizzle/schema";

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.round(similarity * 100) / 100;
}

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|limited)\b\.?/gi, "")
    // Remove special characters
    .replace(/[^\w\s]/g, " ")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize address for comparison
 */
function normalizeAddress(address: string): string {
  if (!address) return "";
  
  return address
    .toLowerCase()
    .trim()
    // Normalize common abbreviations
    .replace(/\bstreet\b/gi, "st")
    .replace(/\bavenue\b/gi, "ave")
    .replace(/\broad\b/gi, "rd")
    .replace(/\bdrive\b/gi, "dr")
    .replace(/\bboulevard\b/gi, "blvd")
    .replace(/\bsuite\b/gi, "ste")
    // Remove special characters
    .replace(/[^\w\s]/g, " ")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compare two accounts for potential duplication
 */
export interface DuplicateMatch {
  accountIdA: number;
  accountIdB: number;
  nameSimilarity: number;
  addressSimilarity: number;
  overallSimilarity: number;
  matchReason: string;
  matchedFields: string[];
}

export function compareAccounts(accountA: any, accountB: any): DuplicateMatch | null {
  // Don't compare an account with itself
  if (accountA.id === accountB.id) return null;
  
  // Calculate name similarity
  const normalizedNameA = normalizeCompanyName(accountA.companyName);
  const normalizedNameB = normalizeCompanyName(accountB.companyName);
  const nameSimilarity = calculateSimilarity(normalizedNameA, normalizedNameB);
  
  // Calculate address similarity
  const normalizedAddressA = normalizeAddress(accountA.address);
  const normalizedAddressB = normalizeAddress(accountB.address);
  const addressSimilarity = calculateSimilarity(normalizedAddressA, normalizedAddressB);
  
  // Determine if this is a potential duplicate
  const isNameMatch = nameSimilarity >= 85;
  const isAddressMatch = addressSimilarity >= 80;
  
  if (!isNameMatch && !isAddressMatch) {
    return null; // Not a duplicate
  }
  
  // Build match details
  const matchedFields: string[] = [];
  const matchReasons: string[] = [];
  
  if (isNameMatch) {
    matchedFields.push("companyName");
    matchReasons.push(`Company name ${nameSimilarity.toFixed(1)}% similar`);
  }
  
  if (isAddressMatch) {
    matchedFields.push("address");
    matchReasons.push(`Address ${addressSimilarity.toFixed(1)}% similar`);
  }
  
  // Check for exact phone match
  if (accountA.phone && accountB.phone) {
    const phoneA = accountA.phone.replace(/\D/g, "");
    const phoneB = accountB.phone.replace(/\D/g, "");
    if (phoneA === phoneB && phoneA.length >= 10) {
      matchedFields.push("phone");
      matchReasons.push("Identical phone number");
    }
  }
  
  // Check for exact website match
  if (accountA.website && accountB.website) {
    const websiteA = accountA.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, "");
    const websiteB = accountB.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, "");
    if (websiteA === websiteB) {
      matchedFields.push("website");
      matchReasons.push("Identical website");
    }
  }
  
  // Calculate overall similarity (weighted average)
  const overallSimilarity = (nameSimilarity * 0.6 + addressSimilarity * 0.4);
  
  return {
    accountIdA: accountA.id,
    accountIdB: accountB.id,
    nameSimilarity,
    addressSimilarity,
    overallSimilarity,
    matchReason: matchReasons.join("; "),
    matchedFields,
  };
}

/**
 * Find all duplicate pairs in the database
 */
export async function findAllDuplicates(): Promise<Map<string, DuplicateMatch[]>> {
  console.log("\n=== Starting Deduplication Analysis ===");
  
  // Get all accounts
  const allAccounts = await db.getAccounts({}, 10000, 0);
  console.log(`Analyzing ${allAccounts.length} accounts for duplicates...`);
  
  const duplicateGroups = new Map<string, DuplicateMatch[]>();
  const processedPairs = new Set<string>();
  
  // Compare each account with every other account
  for (let i = 0; i < allAccounts.length; i++) {
    const accountA = allAccounts[i];
    
    for (let j = i + 1; j < allAccounts.length; j++) {
      const accountB = allAccounts[j];
      
      // Create a unique pair identifier
      const pairKey = `${Math.min(accountA.id, accountB.id)}-${Math.max(accountA.id, accountB.id)}`;
      
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      const match = compareAccounts(accountA, accountB);
      
      if (match) {
        // Find or create duplicate group
        let groupId: string | null = null;
        
        // Check if either account is already in a group
        for (const [existingGroupId, matches] of Array.from(duplicateGroups.entries())) {
          const hasAccountA = matches.some((m: DuplicateMatch) => m.accountIdA === accountA.id || m.accountIdB === accountA.id);
          const hasAccountB = matches.some((m: DuplicateMatch) => m.accountIdA === accountB.id || m.accountIdB === accountB.id);
          
          if (hasAccountA || hasAccountB) {
            groupId = existingGroupId;
            break;
          }
        }
        
        // Create new group if needed
        if (!groupId) {
          groupId = uuidv4();
          duplicateGroups.set(groupId, []);
        }
        
        duplicateGroups.get(groupId)!.push(match);
      }
    }
    
    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`  Processed ${i + 1}/${allAccounts.length} accounts...`);
    }
  }
  
  console.log(`\nFound ${duplicateGroups.size} duplicate groups`);
  return duplicateGroups;
}

/**
 * Save duplicate analysis to database
 */
export async function saveDuplicateAnalysis(duplicateGroups: Map<string, DuplicateMatch[]>): Promise<void> {
  console.log("\n=== Saving Duplicate Analysis ===");
  
  let totalSaved = 0;
  const accountsToFlag = new Set<number>();
  
  for (const [groupId, matches] of Array.from(duplicateGroups.entries())) {
    for (const match of matches) {
      const analysisData: InsertDuplicateAnalysis = {
        duplicateGroupId: groupId,
        accountIdA: match.accountIdA,
        accountIdB: match.accountIdB,
        nameSimilarityScore: String(match.nameSimilarity),
        addressSimilarityScore: String(match.addressSimilarity),
        overallSimilarityScore: String(match.overallSimilarity),
        matchReason: match.matchReason,
        matchedFields: match.matchedFields.join(","),
        algorithmVersion: "1.0",
      };
      
      await db.insertDuplicateAnalysis(analysisData);
      totalSaved++;
      
      // Track accounts that need duplicate flag
      accountsToFlag.add(match.accountIdA);
      accountsToFlag.add(match.accountIdB);
    }
  }
  
  // Update accounts with duplicate flags
  console.log(`\nFlagging ${accountsToFlag.size} accounts as possible duplicates...`);
  
  for (const accountId of Array.from(accountsToFlag)) {
    // Find the group ID for this account
    let groupId: string | null = null;
    
    for (const [gid, matches] of Array.from(duplicateGroups.entries())) {
      const hasAccount = matches.some((m: DuplicateMatch) => m.accountIdA === accountId || m.accountIdB === accountId);
      if (hasAccount) {
        groupId = gid;
        break;
      }
    }
    
    if (groupId) {
      await db.updateAccount(accountId, {
        possibleDuplicate: true,
        duplicateGroupId: groupId,
      });
    }
  }
  
  console.log(`✓ Saved ${totalSaved} duplicate analysis records`);
  console.log(`✓ Flagged ${accountsToFlag.size} accounts as possible duplicates`);
}

/**
 * Run complete deduplication process
 */
export async function runDeduplication(): Promise<void> {
  const duplicateGroups = await findAllDuplicates();
  await saveDuplicateAnalysis(duplicateGroups);
  
  console.log("\n=== Deduplication Complete ===");
}

/**
 * Get deduplication statistics
 */
export async function getDeduplicationStats(): Promise<any> {
  const stats = await db.getLeadStatistics();
  const duplicateGroups = await db.getAllDuplicateGroups();
  
  return {
    totalLeads: stats.totalLeads,
    duplicateLeads: stats.duplicateLeads,
    duplicateGroups: duplicateGroups.length,
    deduplicationRate: stats.totalLeads > 0 
      ? ((stats.duplicateLeads / stats.totalLeads) * 100).toFixed(2) + "%"
      : "0%",
  };
}

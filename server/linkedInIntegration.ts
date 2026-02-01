import * as db from "./db";
import { InsertContact } from "../drizzle/schema";

/**
 * Contact title priorities for safety decision authority
 * Higher score = more decision authority for safety/fire protection
 */
const TITLE_PRIORITY_MAP: Record<string, number> = {
  // Primary contacts - highest authority
  "safety manager": 100,
  "director of safety": 95,
  "director of safety & compliance": 95,
  "director of safety and compliance": 95,
  "corporate safety officer": 90,
  "safety director": 90,
  "director of facilities": 85,
  "facilities director": 85,
  "risk manager": 80,
  "director of risk management": 80,
  "ehs manager": 75,
  "environment health safety": 75,
  "operations manager": 70,
  
  // Secondary contacts - moderate authority
  "coo": 65,
  "chief operating officer": 65,
  "vp operations": 60,
  "vice president operations": 60,
  "vp of operations": 60,
  "operations director": 55,
  "ceo": 50,
  "chief executive officer": 50,
  "president": 50,
  "general manager": 45,
  "procurement manager": 40,
  "purchasing manager": 40,
  "facilities manager": 35,
};

/**
 * Calculate safety decision authority score for a job title
 */
export function calculateSafetyAuthorityScore(title: string): number {
  if (!title) return 0;
  
  const titleLower = title.toLowerCase();
  
  // Check for exact matches first
  for (const [key, score] of Object.entries(TITLE_PRIORITY_MAP)) {
    if (titleLower.includes(key)) {
      return score;
    }
  }
  
  // Fallback scoring based on keywords
  if (titleLower.includes("safety") || titleLower.includes("risk")) return 70;
  if (titleLower.includes("operations") || titleLower.includes("facilities")) return 50;
  if (titleLower.includes("director") || titleLower.includes("vp") || titleLower.includes("vice president")) return 40;
  if (titleLower.includes("manager")) return 30;
  if (titleLower.includes("ceo") || titleLower.includes("president") || titleLower.includes("owner")) return 45;
  
  return 10; // Default low score for unrecognized titles
}

/**
 * Determine if a contact should be primary or secondary based on authority score
 */
export function determineRoleType(authorityScore: number): "Primary" | "Secondary" {
  return authorityScore >= 70 ? "Primary" : "Secondary";
}

/**
 * Mock LinkedIn company search (placeholder for actual API integration)
 * In production, this would call LinkedIn Sales Navigator API or similar
 */
export async function searchLinkedInCompany(companyName: string, location?: string): Promise<any | null> {
  // This is a placeholder. In production, you would:
  // 1. Use LinkedIn Sales Navigator API
  // 2. Use a third-party enrichment service (Clearbit, ZoomInfo, etc.)
  // 3. Use web scraping with proper authentication
  
  console.log(`[LinkedIn] Searching for company: ${companyName} in ${location || "unknown location"}`);
  
  // Return mock data structure
  return {
    companyName: companyName,
    linkedInUrl: `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, "-")}`,
    employeeSize: "51-200",
    industry: "Manufacturing",
  };
}

/**
 * Mock LinkedIn people search (placeholder for actual API integration)
 */
export async function searchLinkedInPeople(companyName: string, titles: string[]): Promise<any[]> {
  // This is a placeholder. In production, you would:
  // 1. Use LinkedIn Sales Navigator API
  // 2. Use a third-party enrichment service
  // 3. Use web scraping with proper authentication
  
  console.log(`[LinkedIn] Searching for contacts at ${companyName} with titles: ${titles.join(", ")}`);
  
  // Return mock data - in production this would return real LinkedIn profiles
  return [];
}

/**
 * Enrich account with LinkedIn company data
 */
export async function enrichAccountWithLinkedIn(accountId: number): Promise<void> {
  try {
    const account = await db.getAccountById(accountId);
    if (!account) {
      console.error(`Account ${accountId} not found`);
      return;
    }
    
    // Search for company on LinkedIn
    const linkedInData = await searchLinkedInCompany(account.companyName, account.county);
    
    if (linkedInData) {
      // Update account with LinkedIn data
      await db.updateAccount(accountId, {
        linkedInCompanyUrl: linkedInData.linkedInUrl,
        linkedInEmployeeSize: linkedInData.employeeSize,
        employeeCountEstimated: parseEmployeeSizeRange(linkedInData.employeeSize),
        employeeEstimateConfidence: "Medium",
      });
      
      console.log(`✓ Enriched ${account.companyName} with LinkedIn data`);
    }
  } catch (error) {
    console.error(`Error enriching account ${accountId}:`, error);
  }
}

/**
 * Parse LinkedIn employee size range to estimated count
 */
function parseEmployeeSizeRange(sizeRange: string): number | undefined {
  const ranges: Record<string, number> = {
    "1-10": 5,
    "11-50": 30,
    "51-200": 125,
    "201-500": 350,
    "501-1000": 750,
    "1001-5000": 3000,
    "5001-10000": 7500,
    "10001+": 15000,
  };
  
  return ranges[sizeRange];
}

/**
 * Find and add contacts for an account
 */
export async function findAndAddContacts(accountId: number): Promise<number> {
  try {
    const account = await db.getAccountById(accountId);
    if (!account) {
      console.error(`Account ${accountId} not found`);
      return 0;
    }
    
    // Define target titles based on priority
    const primaryTitles = [
      "Safety Manager",
      "Director of Safety",
      "Director of Facilities",
      "Risk Manager",
      "EHS Manager",
    ];
    
    const secondaryTitles = [
      "COO",
      "VP Operations",
      "CEO",
      "Operations Director",
      "Procurement Manager",
    ];
    
    // Search for contacts (mock for now)
    const primaryContacts = await searchLinkedInPeople(account.companyName, primaryTitles);
    const secondaryContacts = await searchLinkedInPeople(account.companyName, secondaryTitles);
    
    let contactsAdded = 0;
    
    // Add primary contact (limit to 1)
    for (const contact of primaryContacts.slice(0, 1)) {
      const authorityScore = calculateSafetyAuthorityScore(contact.title);
      const contactData: InsertContact = {
        accountId: accountId,
        contactName: contact.name,
        title: contact.title,
        roleType: "Primary",
        email: contact.email,
        phone: contact.phone,
        linkedInUrl: contact.linkedInUrl,
        safetyDecisionAuthority: authorityScore,
        dataSource: "LinkedIn",
      };
      
      await db.insertContact(contactData);
      contactsAdded++;
    }
    
    // Add secondary contacts (limit to 2)
    for (const contact of secondaryContacts.slice(0, 2)) {
      const authorityScore = calculateSafetyAuthorityScore(contact.title);
      const contactData: InsertContact = {
        accountId: accountId,
        contactName: contact.name,
        title: contact.title,
        roleType: "Secondary",
        email: contact.email,
        phone: contact.phone,
        linkedInUrl: contact.linkedInUrl,
        safetyDecisionAuthority: authorityScore,
        dataSource: "LinkedIn",
      };
      
      await db.insertContact(contactData);
      contactsAdded++;
    }
    
    if (contactsAdded > 0) {
      console.log(`✓ Added ${contactsAdded} contacts for ${account.companyName}`);
    }
    
    return contactsAdded;
  } catch (error) {
    console.error(`Error finding contacts for account ${accountId}:`, error);
    return 0;
  }
}

/**
 * Batch enrich multiple accounts
 */
export async function batchEnrichAccounts(accountIds: number[]): Promise<void> {
  console.log(`\n=== LinkedIn Enrichment Started ===`);
  console.log(`Enriching ${accountIds.length} accounts...\n`);
  
  for (const accountId of accountIds) {
    await enrichAccountWithLinkedIn(accountId);
    await findAndAddContacts(accountId);
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n=== LinkedIn Enrichment Complete ===`);
}

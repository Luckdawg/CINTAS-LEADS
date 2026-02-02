/**
 * Test Data Generation Script
 * 
 * This script generates sample lead data for testing and demonstration purposes.
 * It creates realistic business accounts, contacts, and duplicate analysis records.
 * 
 * Usage: tsx server/generateTestData.ts
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from "./db";
import { InsertAccount, InsertContact, InsertSourceMetadata } from "../drizzle/schema";
import { runDeduplication } from "./deduplication";

// Western Georgia counties (west of I-75)
const WESTERN_GEORGIA_COUNTIES = [
  "Carroll", "Coweta", "Troup", "Muscogee", "Floyd",
  "Polk", "Haralson", "Douglas", "Paulding", "Bartow",
];

const WESTERN_GEORGIA_ZIPS = [
  "30117", "30263", "31901", "30161", "30125", // Carrollton, Newnan, Columbus, Rome, Cedartown
  "30180", "30134", "30120", "30701", "30103", // Villa Rica, Douglasville, Buchanan, Calhoun, Acworth
];

const SAMPLE_COMPANIES = [
  { name: "Columbus Manufacturing Solutions", industry: "Manufacturing", productLines: ["HearingTesting", "Dosimetry", "PPE"] },
  { name: "West Georgia Distribution Center", industry: "Warehousing & Distribution", productLines: ["FirstAidCabinets", "AED", "Training"] },
  { name: "Carrollton Medical Facility", industry: "Healthcare & Medical Facilities", productLines: ["FirstAidCabinets", "AED", "Eyewash"] },
  { name: "Rome Construction Group", industry: "Construction & Contractors", productLines: ["HearingTesting", "PPE", "Training"] },
  { name: "LaGrange Logistics Inc", industry: "Logistics & Transportation", productLines: ["FirstAidCabinets", "Training"] },
  { name: "Newnan Corporate Campus", industry: "Corporate Campuses", productLines: ["AED", "FirstAidCabinets", "Training"] },
  { name: "Villa Rica Hotel & Conference Center", industry: "Hospitality & Entertainment Venues", productLines: ["AED", "Training"] },
  { name: "Cedartown Manufacturing Lab", industry: "Educational Institutions", productLines: ["HearingTesting", "Dosimetry", "Eyewash", "Training"] },
  { name: "Douglasville Industrial Services", industry: "Industrial Services", productLines: ["HearingTesting", "Dosimetry", "PPE", "Eyewash"] },
  { name: "Bremen Retail Center", industry: "Retail with large facilities", productLines: ["AED", "FirstAidCabinets"] },
  { name: "Buchanan Warehouse Operations", industry: "Warehousing & Distribution", productLines: ["FirstAidCabinets", "PPE", "Training"] },
  { name: "Tallapoosa Medical Center", industry: "Healthcare & Medical Facilities", productLines: ["AED", "FirstAidCabinets", "Eyewash"] },
  { name: "Calhoun Construction LLC", industry: "Construction & Contractors", productLines: ["HearingTesting", "PPE", "Training"] },
  { name: "Rockmart Tech Campus", industry: "Corporate Campuses", productLines: ["AED", "Training"] },
  { name: "Bowdon Distribution Hub", industry: "Warehousing & Distribution", productLines: ["FirstAidCabinets", "AED", "PPE"] },
];

const SAMPLE_CONTACTS = [
  { name: "John Smith", title: "Safety Manager", role: "Primary" as const, authority: 95 },
  { name: "Sarah Johnson", title: "Director of Safety & Compliance", role: "Primary" as const, authority: 95 },
  { name: "Michael Chen", title: "Operations Manager", role: "Primary" as const, authority: 70 },
  { name: "Emily Davis", title: "COO", role: "Secondary" as const, authority: 65 },
  { name: "Robert Williams", title: "VP Operations", role: "Secondary" as const, authority: 60 },
  { name: "Jennifer Brown", title: "Facilities Director", role: "Primary" as const, authority: 85 },
  { name: "David Martinez", title: "Risk Manager", role: "Primary" as const, authority: 80 },
  { name: "Lisa Anderson", title: "CEO", role: "Secondary" as const, authority: 50 },
];

const STREETS = [
  "Peachtree Street", "Ponce de Leon Avenue", "Piedmont Road", "Marietta Street",
  "Northside Drive", "Spring Street", "West Peachtree Street", "Howell Mill Road",
  "Moreland Avenue", "Memorial Drive", "Decatur Street", "Auburn Avenue"
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber(): string {
  return `404-${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`;
}

function generateAddress(county: string): string {
  const number = randomNumber(100, 9999);
  const street = randomElement(STREETS);
  const city = county === "Fulton" ? "Atlanta" : county;
  return `${number} ${street}, ${city}, GA ${randomNumber(30000, 30999)}`;
}

async function generateTestAccounts(count: number = 15): Promise<number[]> {
  console.log(`\n=== Generating ${count} Test Accounts ===`);
  const accountIds: number[] = [];

  for (let i = 0; i < count; i++) {
    const company = SAMPLE_COMPANIES[i % SAMPLE_COMPANIES.length];
    const county = randomElement(WESTERN_GEORGIA_COUNTIES);
    const zipCode = randomElement(WESTERN_GEORGIA_ZIPS);
    const address = generateAddress(county);
    
    const account: InsertAccount = {
      uuid: uuidv4(),
      companyName: `${company.name} ${i > 14 ? `Branch ${i - 14}` : ""}`.trim(),
      address: address,
      county: county,
      city: county,
      state: "GA",
      zipCode: zipCode,
      phone: generatePhoneNumber(),
      website: `https://www.${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
      industry: company.industry,
      productLines: company.productLines.join(','),
      employeeCountEstimated: randomNumber(50, 500),
      employeeEstimateConfidence: randomElement(["High", "Medium", "Low"]) as any,
      googleMapsPlaceId: `test_place_${uuidv4()}`,
      googleMapsRating: String((Math.random() * 2 + 3).toFixed(1)),
      googleMapsReviewCount: randomNumber(10, 500),
      dataSource: "TestData",
      possibleDuplicate: false,
    };

    const result = await db.insertAccount(account);
    const accountId = Number(result[0].insertId);
    accountIds.push(accountId);

    // Add source metadata
    const metadata: InsertSourceMetadata = {
      accountId: accountId,
      sourceName: "TestDataGenerator",
      sourceUrl: account.website,
      collectionMethod: "Script",
      queryUsed: `Test data generation for ${county} County`,
      dataQualityScore: randomNumber(70, 100),
      fieldsPopulated: 12,
      totalFields: 15,
    };
    await db.insertSourceMetadata(metadata);

    console.log(`✓ Created: ${account.companyName} (${county})`);
  }

  return accountIds;
}

async function generateTestContacts(accountIds: number[]): Promise<void> {
  console.log(`\n=== Generating Test Contacts ===`);

  for (const accountId of accountIds) {
    const contactCount = randomNumber(1, 3);
    
    for (let i = 0; i < contactCount; i++) {
      const contactTemplate = randomElement(SAMPLE_CONTACTS);
      
      const contact: InsertContact = {
        accountId: accountId,
        contactName: `${contactTemplate.name} ${i > 0 ? `${i + 1}` : ""}`.trim(),
        title: contactTemplate.title,
        roleType: contactTemplate.role,
        email: `${contactTemplate.name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        phone: generatePhoneNumber(),
        linkedInUrl: `https://www.linkedin.com/in/${contactTemplate.name.toLowerCase().replace(/\s+/g, "-")}`,
        safetyDecisionAuthority: contactTemplate.authority,
        dataSource: "TestData",
      };

      await db.insertContact(contact);
    }

    const account = await db.getAccountById(accountId);
    console.log(`✓ Added ${contactCount} contact(s) for ${account?.companyName}`);
  }
}

async function generateDuplicateTestData(): Promise<void> {
  console.log(`\n=== Generating Intentional Duplicates for Testing ===`);

  // Create a few intentional duplicates with slight variations
  const duplicatePairs = [
    {
      original: "Atlanta Manufacturing Solutions",
      duplicate: "Atlanta Manufacturing Solutions Inc",
      county: "Fulton"
    },
    {
      original: "Georgia Distribution Center",
      duplicate: "Georgia Distribution Ctr",
      county: "DeKalb"
    },
  ];

  for (const pair of duplicatePairs) {
    const address = generateAddress(pair.county);
    
    // Create original
    const account1: InsertAccount = {
      uuid: uuidv4(),
      companyName: pair.original,
      address: address,
      county: pair.county,
      city: pair.county === "Fulton" ? "Atlanta" : pair.county,
      state: "GA",
      zipCode: String(randomNumber(30000, 30999)),
      phone: generatePhoneNumber(),
      website: `https://www.${pair.original.toLowerCase().replace(/\s+/g, "")}.com`,
      industry: "Manufacturing",
      productLines: "HearingTesting,FirstAidCabinets,AED,Training",
      employeeCountEstimated: 200,
      employeeEstimateConfidence: "High",
      dataSource: "TestData",
      possibleDuplicate: false,
    };
    await db.insertAccount(account1);

    // Create duplicate with slight variation
    const account2: InsertAccount = {
      uuid: uuidv4(),
      companyName: pair.duplicate,
      address: address.replace("Street", "St"), // Slight address variation
      county: pair.county,
      city: pair.county === "Fulton" ? "Atlanta" : pair.county,
      state: "GA",
      zipCode: String(randomNumber(30000, 30999)),
      phone: generatePhoneNumber(),
      website: account1.website,
      industry: "Manufacturing",
      productLines: "HearingTesting,FirstAidCabinets,AED,Training",
      employeeCountEstimated: 200,
      employeeEstimateConfidence: "Medium",
      dataSource: "TestData",
      possibleDuplicate: false,
    };
    await db.insertAccount(account2);

    console.log(`✓ Created duplicate pair: "${pair.original}" / "${pair.duplicate}"`);
  }
}

async function main() {
  try {
    console.log("=== CINTAS Lead Generation - Test Data Generator ===\n");

    // Generate accounts
    const accountIds = await generateTestAccounts(15);

    // Generate contacts
    await generateTestContacts(accountIds);

    // Generate intentional duplicates
    await generateDuplicateTestData();

    // Run deduplication analysis
    console.log("\n=== Running Deduplication Analysis ===");
    await runDeduplication();

    // Show final statistics
    const stats = await db.getLeadStatistics();
    console.log("\n=== Final Statistics ===");
    console.log(`Total Leads: ${stats.totalLeads}`);
    console.log(`Total Contacts: ${stats.totalContacts}`);
    console.log(`Possible Duplicates: ${stats.duplicateLeads}`);
    console.log(`Avg Contacts per Account: ${stats.avgContactsPerAccount.toFixed(2)}`);

    console.log("\n✓ Test data generation complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating test data:", error);
    process.exit(1);
  }
}

main();

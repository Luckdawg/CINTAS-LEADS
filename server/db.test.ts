import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";
import { InsertAccount, InsertContact } from "../drizzle/schema";
import { v4 as uuidv4 } from 'uuid';

describe("Database Operations", () => {
  let testAccountId: number;

  describe("Account Operations", () => {
    it("should insert a new account", async () => {
      const testAccount: InsertAccount = {
        uuid: uuidv4(),
        companyName: "Test Manufacturing Co",
        address: "123 Test St, Atlanta, GA 30303",
        county: "Fulton",
        city: "Atlanta",
        state: "GA",
        zipCode: "30303",
        phone: "404-555-0100",
        website: "https://test-manufacturing.com",
        industry: "Manufacturing",
        productLines: "HearingTesting,FirstAidCabinets,AED,Training",
        employeeCountEstimated: 150,
        employeeEstimateConfidence: "High",
        dataSource: "Test",
        possibleDuplicate: false,
      };

      const result = await db.insertAccount(testAccount);
      expect(result).toBeDefined();
      expect(result[0].insertId).toBeGreaterThan(0);
      
      testAccountId = Number(result[0].insertId);
    });

    it("should retrieve account by ID", async () => {
      const account = await db.getAccountById(testAccountId);
      
      expect(account).toBeDefined();
      expect(account?.companyName).toBe("Test Manufacturing Co");
      expect(account?.county).toBe("Fulton");
      expect(account?.productLines).toBe("HearingTesting,FirstAidCabinets,AED,Training");
    });

    it("should filter accounts by county", async () => {
      const accounts = await db.getAccounts({ county: "Fulton" }, 10, 0);
      
      expect(Array.isArray(accounts)).toBe(true);
      accounts.forEach(account => {
        expect(account.county).toBe("Fulton");
      });
    });

    it("should filter accounts by product lines", async () => {
      const accounts = await db.getAccounts({ productLines: ["HearingTesting"] }, 10, 0);
      
      expect(Array.isArray(accounts)).toBe(true);
      accounts.forEach(account => {
        expect(account.productLines).toContain("HearingTesting");
      });
    });

    it("should get accounts count", async () => {
      const count = await db.getAccountsCount({});
      
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("should update account", async () => {
      await db.updateAccount(testAccountId, {
        employeeCountEstimated: 200,
        possibleDuplicate: true,
      });

      const updated = await db.getAccountById(testAccountId);
      expect(updated?.employeeCountEstimated).toBe(200);
      expect(updated?.possibleDuplicate).toBe(true);
    });
  });

  describe("Contact Operations", () => {
    it("should insert a new contact", async () => {
      const testContact: InsertContact = {
        accountId: testAccountId,
        contactName: "John Safety Manager",
        title: "Safety Manager",
        roleType: "Primary",
        email: "john@test-manufacturing.com",
        phone: "404-555-0101",
        safetyDecisionAuthority: 95,
        dataSource: "Test",
      };

      const result = await db.insertContact(testContact);
      expect(result).toBeDefined();
      expect(result[0].insertId).toBeGreaterThan(0);
    });

    it("should retrieve contacts by account ID", async () => {
      const contacts = await db.getContactsByAccountId(testAccountId);
      
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0].accountId).toBe(testAccountId);
      expect(contacts[0].contactName).toBe("John Safety Manager");
    });

    it("should retrieve all contacts with accounts", async () => {
      const contactsData = await db.getAllContactsWithAccounts(10, 0);
      
      expect(Array.isArray(contactsData)).toBe(true);
      if (contactsData.length > 0) {
        expect(contactsData[0]).toHaveProperty("contact");
        expect(contactsData[0]).toHaveProperty("account");
      }
    });
  });

  describe("Statistics Operations", () => {
    it("should get lead statistics", async () => {
      const stats = await db.getLeadStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalLeads).toBe("number");
      expect(typeof stats.duplicateLeads).toBe("number");
      expect(typeof stats.totalContacts).toBe("number");
      expect(typeof stats.avgContactsPerAccount).toBe("number");
      expect(Array.isArray(stats.byProductLine)).toBe(true);
      expect(Array.isArray(stats.byCounty)).toBe(true);
    });
  });
});

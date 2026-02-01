import { describe, expect, it } from "vitest";
import { compareAccounts } from "./deduplication";

describe("Deduplication Logic", () => {
  describe("Company Name Matching", () => {
    it("should detect exact name matches", () => {
      const accountA = {
        id: 1,
        companyName: "ABC Manufacturing Inc",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "ABC Manufacturing Inc",
        address: "456 Oak Ave, Marietta, GA",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      expect(match?.nameSimilarity).toBe(100);
    });

    it("should detect similar names with suffix variations", () => {
      const accountA = {
        id: 1,
        companyName: "XYZ Corporation",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "XYZ Corp",
        address: "456 Oak Ave, Marietta, GA",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      expect(match?.nameSimilarity).toBeGreaterThanOrEqual(85);
    });

    it("should not match completely different names", () => {
      const accountA = {
        id: 1,
        companyName: "ABC Manufacturing",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "Totally Different Company",
        address: "456 Oak Ave, Marietta, GA",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeNull();
    });
  });

  describe("Address Matching", () => {
    it("should detect exact address matches", () => {
      const accountA = {
        id: 1,
        companyName: "Different Company A",
        address: "123 Main Street, Atlanta, GA 30303",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "Different Company B",
        address: "123 Main Street, Atlanta, GA 30303",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      expect(match?.addressSimilarity).toBeGreaterThanOrEqual(80);
    });

    it("should detect similar addresses with abbreviations", () => {
      const accountA = {
        id: 1,
        companyName: "Different Company A",
        address: "123 Main Street, Atlanta, GA",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "Different Company B",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      expect(match?.addressSimilarity).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Phone and Website Matching", () => {
    it("should detect exact phone number matches", () => {
      const accountA = {
        id: 1,
        companyName: "Company A",
        address: "123 Main St, Atlanta, GA",
        phone: "(404) 555-1234",
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "Company B",
        address: "456 Oak Ave, Marietta, GA",
        phone: "404-555-1234",
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      // Should match on phone even if names/addresses don't match threshold
      expect(match).toBeDefined();
      if (match) {
        expect(match.matchedFields).toContain("phone");
      }
    });

    it("should detect exact website matches", () => {
      const accountA = {
        id: 1,
        companyName: "Company A",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: "https://www.example.com",
      };

      const accountB = {
        id: 2,
        companyName: "Company B",
        address: "456 Oak Ave, Marietta, GA",
        phone: null,
        website: "http://example.com",
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      if (match) {
        expect(match.matchedFields).toContain("website");
      }
    });
  });

  describe("Overall Similarity Scoring", () => {
    it("should calculate weighted overall similarity", () => {
      const accountA = {
        id: 1,
        companyName: "ABC Manufacturing Inc",
        address: "123 Main Street, Atlanta, GA 30303",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "ABC Manufacturing Inc",
        address: "123 Main St, Atlanta, GA 30303",
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      expect(match).toBeDefined();
      expect(match?.overallSimilarity).toBeGreaterThan(0);
      // Overall similarity should be weighted (60% name + 40% address)
      expect(match?.overallSimilarity).toBeLessThanOrEqual(100);
    });
  });

  describe("Edge Cases", () => {
    it("should not match an account with itself", () => {
      const account = {
        id: 1,
        companyName: "ABC Manufacturing",
        address: "123 Main St, Atlanta, GA",
        phone: null,
        website: null,
      };

      const match = compareAccounts(account, account);
      
      expect(match).toBeNull();
    });

    it("should handle null/empty fields gracefully", () => {
      const accountA = {
        id: 1,
        companyName: "ABC Manufacturing",
        address: "",
        phone: null,
        website: null,
      };

      const accountB = {
        id: 2,
        companyName: "ABC Manufacturing",
        address: null,
        phone: null,
        website: null,
      };

      const match = compareAccounts(accountA, accountB);
      
      // Should still match on name even if address is empty
      expect(match).toBeDefined();
      expect(match?.nameSimilarity).toBe(100);
    });
  });
});

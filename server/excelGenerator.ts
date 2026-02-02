import ExcelJS from "exceljs";
import * as db from "./db";
import { AccountFilters } from "./db";

/**
 * Generate a comprehensive multi-sheet Excel workbook for lead data
 */
export async function generateLeadsWorkbook(filters?: AccountFilters): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = "CINTAS Lead Generation System";
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Generate all sheets
  await generateAccountsSheet(workbook, filters);
  await generateContactsSheet(workbook, filters);
  await generateDuplicatesSheet(workbook);
  await generateDataQualitySheet(workbook);
  
  return workbook;
}

/**
 * Sheet 1: Accounts - All business leads with company data
 */
async function generateAccountsSheet(workbook: ExcelJS.Workbook, filters?: AccountFilters): Promise<void> {
  const sheet = workbook.addWorksheet("Accounts", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  
  // Define columns
  sheet.columns = [
    { header: "Company Name", key: "companyName", width: 35 },
    { header: "Address", key: "address", width: 40 },
    { header: "County", key: "county", width: 15 },
    { header: "City", key: "city", width: 20 },
    { header: "Zip Code", key: "zipCode", width: 12 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Website", key: "website", width: 35 },
    { header: "Industry", key: "industry", width: 25 },
    { header: "Product Lines", key: "productLines", width: 50 },
    { header: "Employee Count Estimated", key: "employeeCount", width: 22 },
    { header: "Confidence", key: "confidence", width: 12 },
    { header: "LinkedIn Company URL", key: "linkedInUrl", width: 35 },
    { header: "Google Maps Rating", key: "rating", width: 18 },
    { header: "⚠ Possible Duplicate", key: "possibleDuplicate", width: 20 },
    { header: "Duplicate Group ID", key: "duplicateGroupId", width: 25 },
  ];
  
  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4788" },
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  
  // Fetch all accounts with filters
  const accounts = await db.getAccounts(filters, 10000, 0);
  
  // Add data rows
  accounts.forEach((account) => {
    const row = sheet.addRow({
      companyName: account.companyName,
      address: account.address,
      county: account.county,
      city: account.city || "",
      zipCode: account.zipCode || "",
      phone: account.phone || "",
      website: account.website || "",
      industry: account.industry || "",
      productLines: account.productLines || "",
      employeeCount: account.employeeCountEstimated || "",
      confidence: account.employeeEstimateConfidence || "",
      linkedInUrl: account.linkedInCompanyUrl || "",
      rating: account.googleMapsRating || "",
      possibleDuplicate: account.possibleDuplicate ? "Yes" : "No",
      duplicateGroupId: account.duplicateGroupId || "",
    });
    
    // Highlight duplicates in yellow
    if (account.possibleDuplicate) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF4CC" },
      };
    }
    
    // Make website a hyperlink
    if (account.website) {
      const websiteCell = row.getCell("website");
      websiteCell.value = {
        text: account.website,
        hyperlink: account.website.startsWith("http") ? account.website : `https://${account.website}`,
      };
      websiteCell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
    
    // Make LinkedIn URL a hyperlink
    if (account.linkedInCompanyUrl) {
      const linkedInCell = row.getCell("linkedInUrl");
      linkedInCell.value = {
        text: "View Profile",
        hyperlink: account.linkedInCompanyUrl,
      };
      linkedInCell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  });
  
  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };
}

/**
 * Sheet 2: Contacts - Decision makers with contact information
 */
async function generateContactsSheet(workbook: ExcelJS.Workbook, filters?: AccountFilters): Promise<void> {
  const sheet = workbook.addWorksheet("Contacts", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  
  // Define columns
  sheet.columns = [
    { header: "Company Name", key: "companyName", width: 35 },
    { header: "County", key: "county", width: 15 },
    { header: "Contact Name", key: "contactName", width: 30 },
    { header: "Title", key: "title", width: 35 },
    { header: "Role Type", key: "roleType", width: 12 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "LinkedIn URL", key: "linkedInUrl", width: 35 },
    { header: "Safety Authority Score", key: "authorityScore", width: 22 },
  ];
  
  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4788" },
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  
  // Fetch all contacts with account information
  const contactsData = await db.getAllContactsWithAccounts(10000, 0);
  
  // Filter contacts based on account filters if provided
  let filteredContacts = contactsData;
  if (filters) {
    const accounts = await db.getAccounts(filters, 10000, 0);
    const accountIds = new Set(accounts.map(a => a.id));
    filteredContacts = contactsData.filter(cd => cd.account && accountIds.has(cd.account.id));
  }
  
  // Add data rows
  filteredContacts.forEach((data) => {
    const contact = data.contact;
    const account = data.account;
    
    if (!account) return;
    
    const row = sheet.addRow({
      companyName: account.companyName,
      county: account.county,
      contactName: contact.contactName,
      title: contact.title || "",
      roleType: contact.roleType,
      email: contact.email || "",
      phone: contact.phone || "",
      linkedInUrl: contact.linkedInUrl || "",
      authorityScore: contact.safetyDecisionAuthority,
    });
    
    // Highlight primary contacts
    if (contact.roleType === "Primary") {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2EFDA" },
      };
    }
    
    // Make LinkedIn URL a hyperlink
    if (contact.linkedInUrl) {
      const linkedInCell = row.getCell("linkedInUrl");
      linkedInCell.value = {
        text: "View Profile",
        hyperlink: contact.linkedInUrl,
      };
      linkedInCell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  });
  
  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };
}

/**
 * Sheet 3: Duplicates - Detailed duplicate analysis
 */
async function generateDuplicatesSheet(workbook: ExcelJS.Workbook): Promise<void> {
  const sheet = workbook.addWorksheet("Duplicates", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });
  
  // Define columns
  sheet.columns = [
    { header: "Duplicate Group ID", key: "groupId", width: 25 },
    { header: "Company A", key: "companyA", width: 35 },
    { header: "Address A", key: "addressA", width: 40 },
    { header: "Company B", key: "companyB", width: 35 },
    { header: "Address B", key: "addressB", width: 40 },
    { header: "Name Similarity %", key: "nameSimilarity", width: 18 },
    { header: "Address Similarity %", key: "addressSimilarity", width: 20 },
    { header: "Overall Similarity %", key: "overallSimilarity", width: 20 },
    { header: "Match Reason", key: "matchReason", width: 50 },
    { header: "Matched Fields", key: "matchedFields", width: 30 },
  ];
  
  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4788" },
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  
  // Fetch duplicate analysis
  const duplicates = await db.getDuplicateAnalysisWithAccounts();
  
  // Add data rows
  for (const dup of duplicates) {
    const analysis = dup.analysis;
    const accountA = dup.accountA;
    
    // Fetch account B details
    const accountB = await db.getAccountById(analysis.accountIdB);
    
    sheet.addRow({
      groupId: analysis.duplicateGroupId,
      companyA: accountA?.companyName || "N/A",
      addressA: accountA?.address || "N/A",
      companyB: accountB?.companyName || "N/A",
      addressB: accountB?.address || "N/A",
      nameSimilarity: Number(analysis.nameSimilarityScore || 0).toFixed(1),
      addressSimilarity: Number(analysis.addressSimilarityScore || 0).toFixed(1),
      overallSimilarity: Number(analysis.overallSimilarityScore || 0).toFixed(1),
      matchReason: analysis.matchReason || "",
      matchedFields: analysis.matchedFields || "",
    });
  }
  
  // Add auto-filter
  if (duplicates.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };
  }
}

/**
 * Sheet 4: Data Quality Report - Statistics and metrics
 */
async function generateDataQualitySheet(workbook: ExcelJS.Workbook): Promise<void> {
  const sheet = workbook.addWorksheet("Data Quality Report");
  
  // Get statistics
  const stats = await db.getLeadStatistics();
  const duplicateGroups = await db.getAllDuplicateGroups();
  
  // Title
  sheet.mergeCells("A1:B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "CINTAS Atlanta Metro Lead Generation - Data Quality Report";
  titleCell.font = { size: 14, bold: true, color: { argb: "FF1F4788" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 25;
  
  // Generation date
  sheet.getCell("A2").value = "Generated:";
  sheet.getCell("B2").value = new Date().toLocaleString();
  sheet.getRow(2).font = { italic: true };
  
  // Section 1: Overall Statistics
  sheet.getCell("A4").value = "Overall Statistics";
  sheet.getCell("A4").font = { size: 12, bold: true };
  sheet.getRow(4).height = 20;
  
  const overallStats = [
    ["Total Leads", stats.totalLeads],
    ["Total Contacts", stats.totalContacts],
    ["Avg Contacts per Account", stats.avgContactsPerAccount.toFixed(2)],
    ["Possible Duplicates", stats.duplicateLeads],
    ["Duplicate Groups", duplicateGroups.length],
    ["Deduplication Rate", `${((stats.duplicateLeads / stats.totalLeads) * 100).toFixed(2)}%`],
  ];
  
  let row = 5;
  overallStats.forEach(([label, value]) => {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
  });
  
  // Section 2: Coverage by Safety Vertical
  row += 2;
  sheet.getCell(`A${row}`).value = "Coverage by Product Line";
  sheet.getCell(`A${row}`).font = { size: 12, bold: true };
  sheet.getRow(row).height = 20;
  row++;
  
  stats.byProductLine.forEach((item: any) => {
    sheet.getCell(`A${row}`).value = item.productLine;
    sheet.getCell(`B${row}`).value = item.count;
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
  });
  
  // Section 3: Coverage by County
  row += 2;
  sheet.getCell(`A${row}`).value = "Coverage by County (Top 10)";
  sheet.getCell(`A${row}`).font = { size: 12, bold: true };
  sheet.getRow(row).height = 20;
  row++;
  
  stats.byCounty.slice(0, 10).forEach((item: any) => {
    sheet.getCell(`A${row}`).value = item.county;
    sheet.getCell(`B${row}`).value = item.count;
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
  });
  
  // Column widths
  sheet.getColumn("A").width = 35;
  sheet.getColumn("B").width = 20;
  
  // Add borders to data sections
  for (let i = 5; i <= row; i++) {
    ["A", "B"].forEach(col => {
      const cell = sheet.getCell(`${col}${i}`);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
}

/**
 * Save workbook to buffer for download
 */
export async function generateLeadsWorkbookBuffer(filters?: AccountFilters): Promise<Buffer> {
  const workbook = await generateLeadsWorkbook(filters);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Save workbook to file
 */
export async function saveLeadsWorkbook(filepath: string, filters?: AccountFilters): Promise<void> {
  const workbook = await generateLeadsWorkbook(filters);
  await workbook.xlsx.writeFile(filepath);
  console.log(`✓ Excel workbook saved to: ${filepath}`);
}

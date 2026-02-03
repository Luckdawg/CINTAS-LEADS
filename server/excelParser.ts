import * as XLSX from "xlsx";
import * as db from "./db";

interface ParseResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse and import leads from Excel file
 */
export async function parseLeadsExcel(fileData: string): Promise<ParseResult> {
  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet (Accounts/Leads)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validate required fields
        if (!row['Company Name'] || !row['Address']) {
          skipped++;
          errors.push(`Row ${i + 2}: Missing required fields (Company Name or Address)`);
          continue;
        }
        
        // Insert account
        await db.insertAccount({
          uuid: `import-${Date.now()}-${i}`,
          dataSource: 'Excel Import',
          companyName: row['Company Name'],
          address: row['Address'],
          county: row['County'] || '',
          city: row['City'] || '',
          zipCode: row['Zip Code'] || row['ZIP Code'] || '',
          phone: row['Phone'] || '',
          website: row['Website'] || '',
          industry: row['Industry'] || '',
          productLines: row['Product Lines'] || '',
          employeeCountEstimated: row['Employee Count Estimated'] ? parseInt(row['Employee Count Estimated']) : undefined,
          employeeEstimateConfidence: row['Confidence'] || 'Medium',
          linkedInCompanyUrl: row['LinkedIn Company URL'] || '',
          googleMapsRating: row['Google Maps Rating'] ? row['Google Maps Rating'].toString() : undefined,
          possibleDuplicate: row['⚠ Possible Duplicate'] === 'Yes' || row['Possible Duplicate'] === 'Yes',
          duplicateGroupId: row['Duplicate Group ID'] || undefined,
        });
        
        imported++;
      } catch (error: any) {
        skipped++;
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      message: `Successfully imported ${imported} leads. Skipped ${skipped} rows.`,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors only
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to parse Excel file: ${error.message}`,
      imported: 0,
      skipped: 0,
      errors: [error.message],
    };
  }
}

/**
 * Parse and import contacts from Excel file
 */
export async function parseContactsExcel(fileData: string): Promise<ParseResult> {
  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet (Contacts)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validate required fields
        if (!row['Company Name'] || !row['Contact Name']) {
          skipped++;
          errors.push(`Row ${i + 2}: Missing required fields (Company Name or Contact Name)`);
          continue;
        }
        
        // Find or create account
        const accounts = await db.getAccounts({ searchQuery: row['Company Name'] }, 1, 0);
        let accountId: number;
        
        if (accounts.length > 0) {
          accountId = accounts[0].id;
        } else {
          // Create new account if not found
          await db.insertAccount({
            uuid: `contact-import-${Date.now()}-${i}`,
            dataSource: 'Contact Excel Import',
            companyName: row['Company Name'],
            address: '',
            county: row['County'] || '',
            city: '',
            zipCode: '',
          });
          // Get the newly created account
          const newAccounts = await db.getAccounts({ searchQuery: row['Company Name'] }, 1, 0);
          accountId = newAccounts[0].id;
        }
        
        // Insert contact
        await db.insertContact({
          accountId,
          dataSource: 'Excel Import',
          contactName: row['Contact Name'],
          title: row['Title'] || '',
          roleType: row['Role Type'] === 'Pri' || row['Role Type'] === 'Primary' ? 'Primary' : 'Secondary',
          email: row['Email'] || '',
          phone: row['Phone'] || '',
          linkedInUrl: row['LinkedIn URL'] || '',
          safetyDecisionAuthority: row['Safety Authority Score'] ? parseInt(row['Safety Authority Score']) : 50,
        });
        
        imported++;
      } catch (error: any) {
        skipped++;
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      message: `Successfully imported ${imported} contacts. Skipped ${skipped} rows.`,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors only
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to parse Excel file: ${error.message}`,
      imported: 0,
      skipped: 0,
      errors: [error.message],
    };
  }
}

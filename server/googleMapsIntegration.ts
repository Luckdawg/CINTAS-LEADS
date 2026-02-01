import { makeRequest } from "./_core/map";
import { v4 as uuidv4 } from 'uuid';
import * as db from "./db";
import { InsertAccount, InsertSourceMetadata } from "../drizzle/schema";

/**
 * Atlanta Metro Counties (15 counties as specified in requirements)
 */
export const ATLANTA_METRO_COUNTIES = [
  "Fulton",
  "DeKalb",
  "Cobb",
  "Gwinnett",
  "Clayton",
  "Cherokee",
  "Henry",
  "Rockdale",
  "Douglas",
  "Fayette",
  "Paulding",
  "Walton",
  "Barrow",
  "Spalding",
  "Coweta",
];

/**
 * Safety-relevant business categories for Google Maps search
 */
export const SAFETY_CATEGORIES = {
  manufacturing: [
    "Manufacturing Plant",
    "Factory",
    "Industrial Facility",
    "Production Facility",
  ],
  warehousing: [
    "Distribution Center",
    "Warehouse",
    "Logistics Center",
    "Fulfillment Center",
  ],
  healthcare: [
    "Hospital",
    "Medical Facility",
    "Clinic",
    "Healthcare Center",
  ],
  construction: [
    "Construction Company",
    "Contractor",
    "Building Contractor",
  ],
  retail: [
    "Shopping Mall",
    "Shopping Complex",
    "Retail Store",
  ],
  hospitality: [
    "Hotel",
    "Event Center",
    "Convention Center",
  ],
  corporate: [
    "Corporate Office",
    "Office Park",
    "Business Park",
  ],
  education: [
    "School",
    "College",
    "University Campus",
  ],
};

/**
 * Map industry categories to safety verticals
 */
export function determineSafetyVertical(industry: string, category: string): "FirstAidSafety" | "FireProtection" | "Both" {
  const industryLower = industry?.toLowerCase() || "";
  const categoryLower = category?.toLowerCase() || "";
  
  // High-risk industries typically need both
  const highRisk = ["manufacturing", "factory", "industrial", "warehouse", "distribution", "hospital", "medical"];
  const hasHighRisk = highRisk.some(term => industryLower.includes(term) || categoryLower.includes(term));
  
  if (hasHighRisk) {
    return "Both";
  }
  
  // Fire protection emphasis
  const fireEmphasis = ["hotel", "event center", "mall", "retail", "restaurant"];
  const hasFireEmphasis = fireEmphasis.some(term => industryLower.includes(term) || categoryLower.includes(term));
  
  if (hasFireEmphasis) {
    return "FireProtection";
  }
  
  // Default to both for safety-relevant businesses
  return "Both";
}

/**
 * Extract county from address using Google Geocoding API
 */
export async function extractCountyFromAddress(address: string): Promise<string | null> {
  try {
    const response = await makeRequest<any>(
      "/maps/api/geocode/json",
      {
        address: address,
        components: "administrative_area:GA|country:US",
      }
    );
    
    if (response.status === "OK" && response.results && response.results.length > 0) {
      const addressComponents = response.results[0].address_components;
      
      // Look for administrative_area_level_2 which is the county
      const countyComponent = addressComponents.find((component: any) =>
        component.types.includes("administrative_area_level_2")
      );
      
      if (countyComponent) {
        // Remove " County" suffix if present
        return countyComponent.long_name.replace(" County", "");
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting county from address:", error);
    return null;
  }
}

/**
 * Search for businesses in a specific county and category
 */
export async function searchBusinesses(county: string, category: string, maxResults = 20): Promise<any[]> {
  try {
    const query = `${category} in ${county} County, Georgia`;
    
    const response = await makeRequest<any>(
      "/maps/api/place/textsearch/json",
      {
        query: query,
        type: "establishment",
      }
    );
    
    if (response.status === "OK" && response.results) {
      return response.results.slice(0, maxResults);
    }
    
    return [];
  } catch (error) {
    console.error(`Error searching businesses in ${county} for ${category}:`, error);
    return [];
  }
}

/**
 * Get detailed place information
 */
export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const response = await makeRequest<any>(
      "/maps/api/place/details/json",
      {
        place_id: placeId,
        fields: "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status",
      }
    );
    
    if (response.status === "OK" && response.result) {
      return response.result;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting place details for ${placeId}:`, error);
    return null;
  }
}

/**
 * Process and save a Google Maps place as an account
 */
export async function processAndSavePlace(place: any, county: string, category: string): Promise<number | null> {
  try {
    // Verify county from address
    const extractedCounty = await extractCountyFromAddress(place.formatted_address || place.vicinity);
    
    // Only proceed if county matches our target counties
    if (!extractedCounty || !ATLANTA_METRO_COUNTIES.includes(extractedCounty)) {
      console.log(`Skipping ${place.name} - not in target counties (found: ${extractedCounty})`);
      return null;
    }
    
    // Get detailed information
    const details = place.place_id ? await getPlaceDetails(place.place_id) : null;
    
    // Determine industry from types
    const types = details?.types || place.types || [];
    const industry = types.find((t: string) => !["establishment", "point_of_interest"].includes(t)) || category;
    
    // Determine safety vertical
    const safetyVertical = determineSafetyVertical(industry, category);
    
    // Extract city and zip from address
    const addressParts = (details?.formatted_address || place.formatted_address || "").split(",");
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 3]?.trim() : null;
    const stateZip = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : null;
    const zipCode = stateZip?.match(/\d{5}/)?.[0] || null;
    
    // Create account record
    const accountData: InsertAccount = {
      uuid: uuidv4(),
      companyName: details?.name || place.name,
      address: details?.formatted_address || place.formatted_address || place.vicinity,
      county: extractedCounty,
      city: city || undefined,
      state: "GA",
      zipCode: zipCode || undefined,
      phone: details?.formatted_phone_number || undefined,
      website: details?.website || undefined,
      industry: industry,
      safetyVertical: safetyVertical,
      googleMapsPlaceId: place.place_id || undefined,
      googleMapsUrl: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : undefined,
      googleMapsRating: details?.rating ? String(details.rating) : undefined,
      googleMapsReviewCount: details?.user_ratings_total || undefined,
      possibleDuplicate: false,
      dataSource: "GoogleMaps",
    };
    
    const result = await db.insertAccount(accountData);
    const accountId = Number(result[0].insertId);
    
    // Save source metadata
    const metadataData: InsertSourceMetadata = {
      accountId: accountId,
      sourceName: "GoogleMaps",
      sourceUrl: accountData.googleMapsUrl || undefined,
      collectionMethod: "API",
      queryUsed: `${category} in ${county} County, Georgia`,
      rawData: JSON.stringify(place),
      dataQualityScore: calculateDataQualityScore(accountData),
      fieldsPopulated: countPopulatedFields(accountData),
      totalFields: 15, // Core fields we track
    };
    
    await db.insertSourceMetadata(metadataData);
    
    console.log(`✓ Saved: ${accountData.companyName} (${extractedCounty} County)`);
    return accountId;
    
  } catch (error) {
    console.error(`Error processing place ${place.name}:`, error);
    return null;
  }
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQualityScore(account: InsertAccount): number {
  let score = 0;
  const weights = {
    companyName: 10,
    address: 10,
    county: 10,
    phone: 15,
    website: 15,
    industry: 10,
    city: 5,
    zipCode: 5,
    googleMapsPlaceId: 10,
    googleMapsRating: 5,
    googleMapsReviewCount: 5,
  };
  
  Object.entries(weights).forEach(([field, weight]) => {
    if (account[field as keyof InsertAccount]) {
      score += weight;
    }
  });
  
  return score;
}

/**
 * Count populated fields
 */
function countPopulatedFields(account: InsertAccount): number {
  const fields = [
    "companyName", "address", "county", "phone", "website", 
    "industry", "city", "zipCode", "googleMapsPlaceId",
    "googleMapsRating", "googleMapsReviewCount", "linkedInCompanyUrl",
    "employeeCountEstimated", "revenueEstimate"
  ];
  
  return fields.filter(field => account[field as keyof InsertAccount]).length;
}

/**
 * Scrape all businesses for a specific county
 */
export async function scrapeCounty(county: string, categoriesPerType = 2): Promise<number> {
  console.log(`\n=== Scraping ${county} County ===`);
  let totalSaved = 0;
  
  for (const [industryType, categories] of Object.entries(SAFETY_CATEGORIES)) {
    console.log(`\nIndustry: ${industryType}`);
    
    // Limit categories per industry type to avoid rate limits
    const selectedCategories = categories.slice(0, categoriesPerType);
    
    for (const category of selectedCategories) {
      console.log(`  Category: ${category}`);
      const places = await searchBusinesses(county, category, 10);
      
      for (const place of places) {
        const accountId = await processAndSavePlace(place, county, category);
        if (accountId) {
          totalSaved++;
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  console.log(`\n✓ ${county} County complete: ${totalSaved} businesses saved`);
  return totalSaved;
}

/**
 * Scrape all Atlanta metro counties
 */
export async function scrapeAllCounties(countiesLimit?: number): Promise<number> {
  console.log("=== Starting Atlanta Metro Lead Generation ===");
  console.log(`Target: ${ATLANTA_METRO_COUNTIES.length} counties\n`);
  
  let grandTotal = 0;
  const countiesToScrape = countiesLimit 
    ? ATLANTA_METRO_COUNTIES.slice(0, countiesLimit)
    : ATLANTA_METRO_COUNTIES;
  
  for (const county of countiesToScrape) {
    const count = await scrapeCounty(county);
    grandTotal += count;
  }
  
  console.log(`\n=== Scraping Complete ===`);
  console.log(`Total businesses saved: ${grandTotal}`);
  
  return grandTotal;
}

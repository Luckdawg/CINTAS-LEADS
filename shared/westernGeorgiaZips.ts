/**
 * Western Georgia ZIP codes - all ZIP codes west of Interstate 75
 * 
 * This list includes major cities and counties in Western Georgia:
 * - Columbus area (Muscogee County)
 * - LaGrange area (Troup County)
 * - Rome area (Floyd County)
 * - Carrollton area (Carroll County)
 * - Newnan area (Coweta County - western portion)
 * - Bremen, Villa Rica, Douglasville (western suburbs)
 * - Cedartown, Rockmart (Polk County)
 * - Calhoun, Dalton (northwest Georgia)
 */

export const WESTERN_GEORGIA_ZIPS = [
  // Columbus area (Muscogee County)
  "31901", "31902", "31903", "31904", "31905", "31906", "31907", "31908", "31909",
  "31914", "31917", "31993", "31995", "31997", "31998", "31999",
  
  // LaGrange area (Troup County)
  "30240", "30241", "30260", "30261",
  
  // Rome area (Floyd County)
  "30161", "30162", "30163", "30164", "30165", "30171",
  
  // Carrollton area (Carroll County)
  "30112", "30116", "30117", "30118", "30119",
  
  // Newnan area (Coweta County - western portion)
  "30263", "30264", "30265", "30271", "30276",
  
  // Villa Rica, Bremen, Tallapoosa (Haralson/Carroll)
  "30180", "30110", "30176",
  
  // Douglasville area (Douglas County - western portion)
  "30133", "30134", "30135", "30154",
  
  // Cedartown, Rockmart (Polk County)
  "30125", "30153",
  
  // Calhoun area (Gordon County)
  "30701", "30703", "30705", "30708",
  
  // Dalton area (Whitfield County - northwest)
  "30719", "30720", "30721", "30722", "30724",
  
  // Summerville, Trion (Chattooga County)
  "30747", "30753",
  
  // Fort Oglethorpe, Ringgold (Catoosa County - northwest)
  "30741", "30736",
  
  // LaFayette, Chickamauga (Walker County)
  "30728", "30707",
  
  // Buchanan, Tallapoosa, Bowdon (Haralson/Carroll)
  "30113", "30120",
  
  // Manchester, Greenville, Woodbury (Meriwether County)
  "31816", "30222", "30293",
  
  // Hamilton, Pine Mountain (Harris County)
  "31811", "31822",
  
  // West Point (Troup County)
  "31833",
  
  // Additional western Georgia ZIP codes
  "30103", "30104", "30107", "30108", "30139", "30140", "30143", "30152",
  "30170", "30175", "30178", "30182", "30183", "30184", "30185", "30187",
  "31730", "31735", "31750", "31756", "31763", "31768", "31771", "31774",
  "31775", "31780", "31783", "31784", "31787", "31788", "31789", "31790",
  "31791", "31792", "31793", "31794", "31795", "31796", "31798", "31799",
];

/**
 * Check if a ZIP code is in Western Georgia (west of I-75)
 */
export function isWesternGeorgiaZip(zipCode: string): boolean {
  // Normalize ZIP code (remove +4 extension if present)
  const normalizedZip = zipCode.split('-')[0]?.trim();
  return WESTERN_GEORGIA_ZIPS.includes(normalizedZip);
}

/**
 * Product line options for CINTAS services
 */
export const PRODUCT_LINES = [
  { value: "HearingTesting", label: "Hearing Testing" },
  { value: "Dosimetry", label: "Dosimetry / Noise Level Testing" },
  { value: "FirstAidCabinets", label: "First Aid Cabinets" },
  { value: "AED", label: "AED Service" },
  { value: "Eyewash", label: "Eyewash Station Service" },
  { value: "Training", label: "First Aid & Safety Training Classes" },
  { value: "PPE", label: "Personal Protective Equipment (PPE)" },
] as const;

export type ProductLine = typeof PRODUCT_LINES[number]["value"];

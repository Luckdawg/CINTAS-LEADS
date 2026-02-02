# CINTAS Atlanta Metro Lead Generation System - TODO

## Phase 1: Database Schema & Infrastructure
- [x] Design PostgreSQL schema for accounts table (company data)
- [x] Design PostgreSQL schema for contacts table (decision makers)
- [x] Design PostgreSQL schema for source_metadata table (data provenance)
- [x] Design PostgreSQL schema for duplicate_analysis table (deduplication flags)
- [x] Create database migration and push schema

## Phase 2: Data Collection Infrastructure
- [ ] Implement Google Maps API integration for business discovery
- [ ] Create scraper for Atlanta metro counties (15 counties)
- [ ] Filter businesses by safety-relevant categories
- [ ] Tag accounts with safety vertical (FirstAidSafety/FireProtection/Both)
- [ ] Implement LinkedIn API integration for company enrichment
- [ ] Implement LinkedIn contact discovery for decision makers
- [ ] Rank and attach contacts by safety decision authority

## Phase 3: Deduplication & Data Quality
- [ ] Implement fuzzy matching algorithm for company names (≥85% similarity)
- [ ] Implement address similarity matching (≥80% similarity)
- [ ] Create duplicate flagging system (no removals, flag only)
- [ ] Generate duplicate group IDs for related records
- [ ] Build data quality metrics calculation

## Phase 4: Excel Export System
- [x] Create multi-sheet workbook generator using exceljs
- [x] Implement Sheet 1: Accounts with all company data
- [x] Implement Sheet 2: Contacts with decision maker information
- [x] Implement Sheet 3: Duplicates analysis report
- [x] Add data quality metrics sheet
- [x] Implement download endpoint for Excel files

## Phase 5: Web Dashboard
- [x] Design clean, functional UI theme for business data management
- [x] Create dashboard layout with navigation
- [x] Build accounts table view with sortable columns
- [x] Build contacts table view with company associations
- [x] Implement pagination for large datasets
- [x] Add statistics dashboard (total leads, duplicates, coverage, quality metrics)
- [x] Implement click-through links (website, LinkedIn company, LinkedIn contact)
- [x] Add duplicate highlighting in table views

## Phase 6: Advanced Filtering System
- [x] Implement county filter (15 Atlanta metro counties)
- [x] Implement industry filter
- [x] Implement safety vertical filter (FirstAidSafety/FireProtection/Both)
- [x] Implement employee size range filter
- [x] Implement duplicate status filter
- [x] Add filter state management and URL sync
- [x] Create Excel export with active filters applied

## Phase 7: Lead Generation Execution
- [ ] Configure API keys for Outscraper and LinkedIn
- [ ] Execute Google Maps scraping for all 15 counties
- [ ] Execute LinkedIn enrichment for discovered companies
- [ ] Execute contact discovery for all accounts
- [ ] Run deduplication analysis on full dataset
- [ ] Generate comprehensive Excel workbook
- [ ] Verify data quality and completeness
- [ ] Create final checkpoint and deliver results

## Testing & Quality Assurance
- [ ] Write vitest tests for database operations
- [ ] Write vitest tests for deduplication logic
- [ ] Write vitest tests for Excel generation
- [ ] Write vitest tests for filtering logic
- [ ] End-to-end testing of lead generation workflow
- [ ] Verify county authentication for all addresses
- [ ] Validate contact ranking algorithm

## CINTAS Branding Updates
- [x] Copy CINTAS logo to project public folder
- [x] Update theme colors to match CINTAS brand (navy blue #1E3A8A, red #B91C1C)
- [x] Add logo to dashboard header
- [x] Update page titles and branding text
- [x] Apply CINTAS color scheme throughout UI

## Critical Bug Fix - Empty Select Values
- [x] Find all Select components with empty string values
- [x] Replace empty string "" with placeholder value "all" or "none"
- [x] Test all Select dropdowns to ensure no errors

## GitHub Repository Sync
- [x] Check git status and remote configuration
- [x] Push code to https://github.com/Luckdawg/CINTAS-LEADS
- [x] Verify sync completed successfully

## Major Update - Remove Fire Protection & Add Product Line Filters

### Database & Backend Updates
- [x] Update database schema to add product_lines field (multi-select)
- [x] Add zipCode field to accounts table
- [x] Create Western Georgia ZIP code lookup table/constant
- [x] Remove Fire Protection from safetyVertical enum
- [x] Update backend query logic to support product line filtering
- [x] Update geographic filtering from Atlanta Metro to Western Georgia (west of I-75)

### Remove Fire Protection
- [x] Remove Fire Protection from database enum
- [x] Remove Fire Protection from API validation
- [x] Remove Fire Protection from UI dropdowns and filters
- [x] Remove Fire Protection from test data
- [x] Update statistics to exclude Fire Protection

### Add New Product Line Filters
- [x] Add Hearing Testing filter
- [x] Add Dosimetry / Noise Level Testing filter
- [x] Add First Aid Cabinets filter
- [x] Add AED Service filter
- [x] Add Eyewash Station Service filter
- [x] Add First Aid & Safety Training Classes filter
- [x] Add Personal Protective Equipment (PPE) filter
- [x] Implement multi-select UI for product lines
- [x] Update backend to filter by multiple product lines

### Geographic Filtering
- [x] Define Western Georgia ZIP codes (west of I-75)
- [x] Add ZIP code input field (multi-ZIP support)
- [x] Add "Western Georgia" predefined region option
- [x] Update backend to filter by ZIP codes
- [x] Update test data with Western Georgia locations

### Testing
- [x] Update unit tests for new product line filters
- [x] Add tests for Western Georgia geographic filtering
- [x] Add tests for ZIP code filtering
- [x] Verify all existing functionality works
- [x] End-to-end testing of new filters

## Landing Page & Leads Page Enhancements

### Landing Page Updates
- [x] Replace county breakdown with ZIP code breakdown
- [x] Add drilldown functionality to Total Leads statistic
- [x] Add drilldown functionality to Total Contacts statistic
- [x] Add drilldown functionality to Possible Duplicates statistic
- [x] Add drilldown functionality to Product Line breakdown
- [x] Add drilldown functionality to ZIP code breakdown
- [x] Implement modal/navigation to filtered views from statistics

### Leads Page Updates
- [x] Add ZIP code dropdown filter with all relevant ZIP codes
- [x] Implement inline editing for lead fields
- [x] Add save/cancel buttons for edited leads
- [x] Add edit mode toggle for each lead row
- [x] Implement backend update endpoint for lead editing
- [x] Add validation for edited fields
- [x] Show success/error messages for save operations

### Backend Updates
- [x] Add getLeadsByZipCode statistics query
- [x] Add updateAccount endpoint for lead editing
- [x] Add validation for account updates
- [x] Update statistics to include ZIP code breakdown

## Fix Duplicate Key Errors
- [x] Investigate duplicate ZIP codes in byZipCode statistics
- [x] Fix SQL query to ensure unique ZIP codes with aggregated counts
- [x] Update Dashboard to use unique keys for ZIP code rendering
- [x] Test and verify no duplicate key warnings

## Contact Editing Feature
- [x] Add updateContact backend endpoint with validation
- [x] Add inline editing UI to Contacts page
- [x] Implement edit/save/cancel buttons for each contact
- [x] Add optimistic updates for instant feedback
- [x] Add error handling and success messages
- [x] Write unit tests for updateContact endpoint
- [x] Test end-to-end contact editing workflow

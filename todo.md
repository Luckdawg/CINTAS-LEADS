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
- [ ] Check git status and remote configuration
- [ ] Push code to https://github.com/Luckdawg/CINTAS-LEADS
- [ ] Verify sync completed successfully

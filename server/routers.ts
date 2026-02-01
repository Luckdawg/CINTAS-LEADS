import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leads: router({
    // Get paginated accounts with filtering
    getAccounts: publicProcedure
      .input(z.object({
        county: z.string().optional(),
        safetyVertical: z.enum(["FirstAidSafety", "FireProtection", "Both"]).optional(),
        industry: z.string().optional(),
        minEmployees: z.number().optional(),
        maxEmployees: z.number().optional(),
        duplicatesOnly: z.boolean().optional(),
        searchQuery: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const { limit, offset, ...filters } = input;
        const accounts = await db.getAccounts(filters, limit, offset);
        const total = await db.getAccountsCount(filters);
        
        return {
          accounts,
          total,
          hasMore: offset + limit < total,
        };
      }),

    // Get single account by ID
    getAccountById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountById(input.id);
      }),

    // Get contacts for an account
    getContactsByAccountId: publicProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactsByAccountId(input.accountId);
      }),

    // Get all contacts with account information
    getAllContactsWithAccounts: publicProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getAllContactsWithAccounts(input.limit, input.offset);
      }),

    // Get lead statistics for dashboard
    getStatistics: publicProcedure
      .query(async () => {
        return await db.getLeadStatistics();
      }),

    // Get duplicate groups
    getDuplicateGroups: publicProcedure
      .query(async () => {
        return await db.getAllDuplicateGroups();
      }),

    // Get duplicates by group ID
    getDuplicatesByGroupId: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        const duplicates = await db.getDuplicatesByGroupId(input.groupId);
        
        // Fetch account details for each duplicate pair
        const enrichedDuplicates = await Promise.all(
          duplicates.map(async (dup) => {
            const accountA = await db.getAccountById(dup.accountIdA);
            const accountB = await db.getAccountById(dup.accountIdB);
            return {
              ...dup,
              accountA,
              accountB,
            };
          })
        );
        
        return enrichedDuplicates;
      }),

    // Get all duplicate analysis with account details
    getAllDuplicatesWithAccounts: publicProcedure
      .query(async () => {
        return await db.getDuplicateAnalysisWithAccounts();
      }),
  }),

  export: router({
    // Generate and download Excel workbook
    generateExcel: publicProcedure
      .input(z.object({
        county: z.string().optional(),
        safetyVertical: z.enum(["FirstAidSafety", "FireProtection", "Both"]).optional(),
        industry: z.string().optional(),
        minEmployees: z.number().optional(),
        maxEmployees: z.number().optional(),
        duplicatesOnly: z.boolean().optional(),
        searchQuery: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateLeadsWorkbookBuffer } = await import("./excelGenerator");
        const buffer = await generateLeadsWorkbookBuffer(input);
        return {
          data: buffer.toString('base64'),
          filename: `CINTAS_Leads_${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("leads.updateContact", () => {
  it("accepts valid contact update with all fields", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      contactName: "John Smith",
      title: "Safety Director",
      email: "john.smith@example.com",
      phone: "404-555-0123",
      linkedInUrl: "https://linkedin.com/in/johnsmith",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts partial contact update with only contactName", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      contactName: "Jane Doe",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts partial contact update with only email and phone", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      email: "updated@example.com",
      phone: "770-555-9999",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts partial contact update with only title", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      title: "VP of Operations",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts partial contact update with only LinkedIn URL", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      linkedInUrl: "https://linkedin.com/in/newprofile",
    });

    expect(result).toEqual({ success: true });
  });

  it("requires id field", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.updateContact({
        // @ts-expect-error - testing missing id
        contactName: "Test",
      })
    ).rejects.toThrow();
  });

  it("accepts empty string values for optional fields", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.updateContact({
      id: 1,
      email: "",
      phone: "",
      linkedInUrl: "",
    });

    expect(result).toEqual({ success: true });
  });
});

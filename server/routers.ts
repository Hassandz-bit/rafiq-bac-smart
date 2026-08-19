import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hasAnyRole, type AppRole } from "./authorization";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCurrentCurriculumOverview, getSourceRegistryForStudio } from "./curriculum";
import { setUserRole } from "./db";

const contentStudioProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasAnyRole(ctx.user.role, ["admin", "content_editor", "academic_reviewer"])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه المساحة مخصصة لفريق المحتوى الأكاديمي." });
  }
  return next();
});

const adminOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية متاحة للمدير فقط." });
  }
  return next();
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
  curriculum: router({
    overview: publicProcedure.query(() => getCurrentCurriculumOverview()),
  }),
  studio: router({
    sourceRegistry: contentStudioProcedure.query(() => getSourceRegistryForStudio()),
  }),
  administration: router({
    setRole: adminOnlyProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "content_editor", "academic_reviewer", "student"]) }))
      .mutation(async ({ input }) => {
        await setUserRole(input.userId, input.role as AppRole);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;

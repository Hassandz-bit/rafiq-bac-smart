import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hasAnyRole, type AppRole } from "./authorization";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCurrentCurriculumOverview, getSourceRegistryForStudio, getStudentAccessibleExercises, getStudentPublishedLearningItems, getStudentVisibleVisualAssets } from "./curriculum";
import { setUserRole } from "./db";
import { recordStudentAttempt } from "./studentAttempts";
import { getPlanCatalog } from "./subscriptions";
import { autosaveBacSession, startBacSession, submitBacSession } from "./bacSessions";
import { getStudentProgressSummary } from "./studentProgress";
import { generateSmartAssessment } from "./smartAssessment";

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
    // This is the authenticated student-safe feed. Students consume it directly; staff may call the same
    // restricted feed for preview, but it never returns drafts, internal pilots, or unverified sources.
    studentLearningItems: protectedProcedure.query(({ ctx }) => getStudentPublishedLearningItems(ctx.user.id)),
    // Visual assets use the same parent-learning-record gate; internal-review assets cannot bypass it.
    studentVisualAssets: protectedProcedure.query(({ ctx }) => getStudentVisibleVisualAssets(ctx.user.id)),
  }),
  studio: router({
    sourceRegistry: contentStudioProcedure.query(() => getSourceRegistryForStudio()),
  }),
  attempts: router({
    accessibleExercises: protectedProcedure.query(({ ctx }) => getStudentAccessibleExercises(ctx.user.id)),
    submit: protectedProcedure
      .input(
        z.object({
          exerciseId: z.number().int().positive(),
          answerPayload: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number(), z.boolean()]))]),
          hintsUsed: z.number().int().min(0).max(3),
          revealedSteps: z.number().int().min(0).max(20),
          durationSeconds: z.number().int().min(0).max(24 * 60 * 60),
          errorType: z.string().min(1).max(80).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await recordStudentAttempt({ userId: ctx.user.id, ...input, answerPayload: input.answerPayload as import("./exerciseEngine").ExerciseAnswer });
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "التمرين غير متاح لحساب الطالب أو ما زال قيد المراجعة." });
        }
        return result;
      }),
  }),
  bac: router({
    start: protectedProcedure.input(z.object({ subjectId: z.number().int().positive() })).mutation(({ ctx, input }) => startBacSession(ctx.user.id, input.subjectId)),
    autosave: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), elapsedSeconds: z.number().int().min(0) })).mutation(({ ctx, input }) => autosaveBacSession({ userId: ctx.user.id, ...input })),
    submit: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), elapsedSeconds: z.number().int().min(0), score: z.number().min(0).max(100), masteryAverage: z.number().min(0).max(100), incompleteLessons: z.number().int().min(0), remainingDays: z.number().int().min(0) })).mutation(({ ctx, input }) => submitBacSession({ userId: ctx.user.id, ...input })),
  }),
  progress: router({
    summary: protectedProcedure.query(({ ctx }) => getStudentProgressSummary(ctx.user.id)),
    smartAssessment: protectedProcedure.query(({ ctx }) => generateSmartAssessment(ctx.user.id)),
  }),
  administration: router({
    planCatalog: adminOnlyProcedure.query(() => getPlanCatalog()),
    setRole: adminOnlyProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "content_editor", "academic_reviewer", "student"]) }))
      .mutation(async ({ input }) => {
        await setUserRole(input.userId, input.role as AppRole);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;

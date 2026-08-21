import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hasAnyRole, type AppRole } from "./authorization";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getCurrentCurriculumOverview, getSourceRegistryForStudio, getStudioReviewQueue, getStudentAccessibleExercises, getStudentPublishedLearningItems, getStudentVisibleVisualAssets } from "./curriculum";
import { setUserRole } from "./db";
import { recordStudentAttempt } from "./studentAttempts";
import { getPlanCatalog, updatePlanConfiguration } from "./subscriptions";
import { getPlanAssignmentAudit, getPlanChangeAudit, grantPlanAccess, previewPlanAssignment } from "./subscriptionGrants";
import { autosaveBacSession, startBacSession, submitBacSession } from "./bacSessions";
import { completeStudentReview, getStudentProgressSummary } from "./studentProgress";
import { generateSmartAssessment } from "./smartAssessment";
import { completeHassemFocusSession, getLatestHassemFocusSession, startHassemFocusSession } from "./hassemFocusSessions";
import { reviewLearningItem } from "./contentReview";
import { getHassemPlanForStudent } from "./hassemStudentPlan";
import { getHassemFinalMemory, toggleHassemFinalMemory } from "./hassemFinalMemory";
import { updateSourceVerification } from "./sourceVerification";
import { createSourceLinkedDraftComponent, discardDraftComponent, getDraftComponents, submitDraftComponentForReview, updateDraftComponent } from "./draftComponents";
import { getLocalPaymentStatus } from "./localPaymentAbstraction";
import { getOfficialBookIntake, reviewOfficialBookUpload } from "./officialBookIntake";
import { archiveStandaloneUnverifiedSourceRecord, createUnverifiedSourceRecord, updateStandaloneUnverifiedSourceRecord } from "./sourceRecords";
import { createDraftCurriculumLesson, createDraftCurriculumUnit, getDraftCurriculumLessonsForStudio, getDraftCurriculumUnitsForStudio, updateDraftCurriculumLesson, updateDraftCurriculumUnit } from "./curriculumDrafts";

const contentStudioProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasAnyRole(ctx.user.role, ["admin", "content_editor", "academic_reviewer"])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه المساحة مخصصة لفريق المحتوى الأكاديمي." });
  }
  return next();
});

const contentEditorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasAnyRole(ctx.user.role, ["admin", "content_editor"])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "إنشاء المسودات متاح للمحرر أو المدير فقط." });
  }
  return next();
});

const adminOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية متاحة للمدير فقط." });
  }
  return next();
});

const academicReviewerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasAnyRole(ctx.user.role, ["admin", "academic_reviewer"])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "قرار المراجعة الأكاديمية متاح للمراجع أو المدير فقط." });
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
    draftCurriculumUnits: contentStudioProcedure.query(() => getDraftCurriculumUnitsForStudio()),
    draftCurriculumLessons: contentStudioProcedure.query(() => getDraftCurriculumLessonsForStudio()),
    createDraftUnit: contentEditorProcedure
      .input(z.object({ subjectId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(220), summaryAr: z.string().trim().max(4000).optional(), sortOrder: z.number().int().min(0).max(9999).optional() }))
      .mutation(async ({ input }) => {
        const result = await createDraftCurriculumUnit(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المادة المحددة غير موجودة في المنهج." });
        return result;
      }),
    createDraftLesson: contentEditorProcedure
      .input(z.object({ unitId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(220), objectiveAr: z.string().trim().max(4000).optional(), estimatedMinutes: z.number().int().min(1).max(600).optional(), sortOrder: z.number().int().min(0).max(9999).optional() }))
      .mutation(async ({ input }) => {
        const result = await createDraftCurriculumLesson(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "وحدة المنهج المحددة غير موجودة." });
        return result;
      }),
    updateDraftUnit: contentEditorProcedure
      .input(z.object({ unitId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(220), summaryAr: z.string().trim().max(4000).optional(), sortOrder: z.number().int().min(0).max(9999) }))
      .mutation(async ({ input }) => {
        const result = await updateDraftCurriculumUnit(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "وحدة المنهج المحددة غير موجودة." });
        return result;
      }),
    updateDraftLesson: contentEditorProcedure
      .input(z.object({ lessonId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(220), objectiveAr: z.string().trim().max(4000).optional(), estimatedMinutes: z.number().int().min(1).max(600).optional(), sortOrder: z.number().int().min(0).max(9999) }))
      .mutation(async ({ input }) => {
        const result = await updateDraftCurriculumLesson(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "درس المنهج المحدد غير موجود." });
        return result;
      }),
    createSource: contentEditorProcedure
      .input(z.object({ sourceAuthority: z.string().trim().min(3).max(180), documentTitle: z.string().trim().min(3).max(500), url: z.string().url().max(1000), subjectId: z.number().int().positive(), academicYear: z.string().trim().max(20).optional(), level: z.string().trim().max(120).optional(), track: z.string().trim().max(120).optional(), edition: z.string().trim().max(120).optional(), sourceVersion: z.string().trim().max(120).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await createUnverifiedSourceRecord({ ...input, createdByUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المادة المحددة غير موجودة في المنهج." });
        return result;
      }),
    updateStandaloneSource: contentEditorProcedure
      .input(z.object({ sourceId: z.number().int().positive(), sourceAuthority: z.string().trim().min(3).max(180), documentTitle: z.string().trim().min(3).max(500), url: z.string().url().max(1000), academicYear: z.string().trim().max(20).optional(), level: z.string().trim().max(120).optional(), track: z.string().trim().max(120).optional(), edition: z.string().trim().max(120).optional(), sourceVersion: z.string().trim().max(120).optional() }))
      .mutation(async ({ input }) => {
        const result = await updateStandaloneUnverifiedSourceRecord(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "سجل المصدر غير موجود." });
        return result;
      }),
    archiveStandaloneSource: contentEditorProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const result = await archiveStandaloneUnverifiedSourceRecord({ ...input, archivedByUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "سجل المصدر غير موجود." });
        return result;
      }),
    officialBookIntake: contentStudioProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional()).query(({ input }) => getOfficialBookIntake(input?.limit ?? 50)),
    reviewQueue: contentStudioProcedure.query(() => getStudioReviewQueue()),
    reviewLearningItem: academicReviewerProcedure
      .input(z.object({ learningItemId: z.number().int().positive(), decision: z.enum(["approved", "changes_requested", "rejected"]), noteAr: z.string().trim().max(2000).optional() }))
      .mutation(({ ctx, input }) => reviewLearningItem({ reviewerUserId: ctx.user.id, role: ctx.user.role, ...input })),
    updateSourceVerification: academicReviewerProcedure
      .input(z.object({ sourceId: z.number().int().positive(), verificationStatus: z.enum(["unverified", "current_official", "official_but_version_unconfirmed", "historical_official"]), verificationNotes: z.string().trim().min(3).max(4000) }))
      .mutation(async ({ ctx, input }) => {
        const result = await updateSourceVerification({ ...input, reviewerUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المصدر غير موجود." });
        return result;
      }),
    reviewOfficialBookUpload: academicReviewerProcedure
      .input(z.object({ uploadId: z.number().int().positive(), verificationStatus: z.enum(["unverified", "current_official", "official_but_version_unconfirmed", "historical_official"]), verificationChecklist: z.object({ cover: z.boolean(), title: z.boolean(), level: z.boolean(), track: z.boolean(), publisher: z.boolean(), authorship: z.boolean(), edition: z.boolean(), bookCode: z.boolean(), publicationYear: z.boolean(), tableOfContents: z.boolean() }) }))
      .mutation(async ({ ctx, input }) => {
        const result = await reviewOfficialBookUpload({ ...input, reviewerUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "الكتاب المرفوع غير موجود في طابور الفحص." });
        return result;
      }),
    createDraftComponent: contentEditorProcedure
      .input(z.object({ parentLearningItemId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(240), componentKey: z.string().trim().min(2).max(60), draftTextAr: z.string().trim().min(8).max(6000) }))
      .mutation(async ({ ctx, input }) => {
        const result = await createSourceLinkedDraftComponent({ ...input, authorUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "العنصر الأب أو مصدره غير متاح لإنشاء مسودة مرتبطة." });
        return result;
      }),
    updateDraftComponent: contentEditorProcedure
      .input(z.object({ learningItemId: z.number().int().positive(), titleAr: z.string().trim().min(3).max(240), draftTextAr: z.string().trim().min(8).max(6000) }))
      .mutation(async ({ input }) => {
        const result = await updateDraftComponent(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المسودة غير متاحة للتعديل." });
        return result;
      }),
    submitDraftComponentForReview: contentEditorProcedure
      .input(z.object({ learningItemId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const result = await submitDraftComponentForReview(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المسودة غير متاحة للإرسال للمراجعة." });
        return result;
      }),
    discardDraftComponent: contentEditorProcedure
      .input(z.object({ learningItemId: z.number().int().positive(), noteAr: z.string().trim().max(1000).optional() }))
      .mutation(async ({ input }) => {
        const result = await discardDraftComponent(input);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "المسودة غير متاحة للإلغاء." });
        return result;
      }),
    draftComponents: contentStudioProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional()).query(({ input }) => getDraftComponents(input?.limit ?? 50)),
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
    submit: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), elapsedSeconds: z.number().int().min(0), score: z.number().min(0).max(100), remainingDays: z.number().int().min(0).max(3650) })).mutation(async ({ ctx, input }) => {
      const progress = await getStudentProgressSummary(ctx.user.id);
      const masteryAverage = progress.mastery.length ? progress.mastery.reduce((total, record) => total + Number(record.score), 0) / progress.mastery.length : 0;
      const incompleteLessons = progress.errors.length + progress.reviews.length;
      return submitBacSession({ userId: ctx.user.id, ...input, masteryAverage, incompleteLessons });
    }),
  }),
  progress: router({
    summary: protectedProcedure.query(({ ctx }) => getStudentProgressSummary(ctx.user.id)),
    completeReview: protectedProcedure.input(z.object({ reviewId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const completed = await completeStudentReview({ userId: ctx.user.id, reviewId: input.reviewId });
      if (!completed) throw new TRPCError({ code: "NOT_FOUND", message: "المراجعة غير موجودة أو لا تخص هذا الحساب أو أُنجزت سابقًا." });
      return completed;
    }),
    smartAssessment: protectedProcedure.query(({ ctx }) => generateSmartAssessment(ctx.user.id)),
  }),
  hassem: router({
    plan: protectedProcedure.input(z.object({ availableDays: z.number().int().min(1).max(365) })).query(({ ctx, input }) => getHassemPlanForStudent(ctx.user.id, input.availableDays)),
    finalMemory: protectedProcedure.query(({ ctx }) => getHassemFinalMemory(ctx.user.id)),
    toggleFinalMemory: protectedProcedure.input(z.object({ itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const item = await toggleHassemFinalMemory({ userId: ctx.user.id, itemId: input.itemId });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "بطاقة الذاكرة غير موجودة أو لا تخص هذا الحساب." });
      return item;
    }),
    latestSession: protectedProcedure.query(({ ctx }) => getLatestHassemFocusSession(ctx.user.id)),
    startSession: protectedProcedure.input(z.object({ durationMinutes: z.union([z.literal(10), z.literal(20)]) })).mutation(({ ctx, input }) => startHassemFocusSession(ctx.user.id, input.durationMinutes)),
    completeSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const completed = await completeHassemFocusSession({ userId: ctx.user.id, sessionId: input.sessionId });
      if (!completed) throw new TRPCError({ code: "NOT_FOUND", message: "جلسة الحسم غير موجودة أو لا تخص هذا الحساب." });
      return completed;
    }),
  }),
  administration: router({
    planCatalog: adminOnlyProcedure.query(() => getPlanCatalog()),
    localPaymentStatus: adminOnlyProcedure.query(() => getLocalPaymentStatus()),
    previewPlanAssignment: adminOnlyProcedure
      .input(z.object({ planCode: z.enum(["season_one_subject", "season_two_subjects", "season_three_subjects", "hasm_one_subject", "hasm_two_subjects", "hasm_three_subjects"]), subjects: z.array(z.enum(["math", "physics", "natural_sciences"])).min(1).max(3) }))
      .query(({ input }) => previewPlanAssignment(input)),
    planAssignmentAudit: adminOnlyProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(30) }).optional()).query(({ input }) => getPlanAssignmentAudit(input?.limit ?? 30)),
    planChangeAudit: adminOnlyProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(30) }).optional()).query(({ input }) => getPlanChangeAudit(input?.limit ?? 30)),
    updatePlanConfiguration: adminOnlyProcedure
      .input(z.object({ id: z.number().int().positive(), priceDzd: z.number().int().min(0).max(100000), durationDays: z.number().int().min(0).max(730), subjectLimit: z.number().int().min(0).max(3), subjectBundle: z.array(z.enum(["math", "physics", "natural_sciences"])).min(1).max(3), isActive: z.boolean(), entitlements: z.array(z.string().trim().min(1).max(100)).max(12) }))
      .mutation(({ input }) => updatePlanConfiguration(input)),
    grantPlanAccess: adminOnlyProcedure
      .input(z.object({ userId: z.number().int().positive(), planCode: z.enum(["season_one_subject", "season_two_subjects", "season_three_subjects", "hasm_one_subject", "hasm_two_subjects", "hasm_three_subjects"]), subjects: z.array(z.enum(["math", "physics", "natural_sciences"])).min(1).max(3), changeKind: z.enum(["manual_assignment", "upgrade", "promotion"]).default("manual_assignment"), noteAr: z.string().trim().max(4000).optional(), expiresAt: z.date().nullable().optional() }))
      .mutation(({ ctx, input }) => grantPlanAccess({ ...input, actorUserId: ctx.user.id })),
    setRole: adminOnlyProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "content_editor", "academic_reviewer", "student"]) }))
      .mutation(async ({ input }) => {
        await setUserRole(input.userId, input.role as AppRole);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;

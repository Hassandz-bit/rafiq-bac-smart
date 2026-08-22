import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRoleValues = ["admin", "content_editor", "academic_reviewer", "student", "partner"] as const;
export const sourceStatusValues = [
  "current_official",
  "official_but_version_unconfirmed",
  "historical_official",
  "unverified",
] as const;
export const sourceGateValues = ["verified", "not_found", "requires_user_upload", "waiting_for_current_official_book"] as const;
export const workflowValues = ["draft", "in_review", "approved", "published", "archived"] as const;
export const masteryValues = ["start", "understand", "practice", "near_mastery", "mastered"] as const;
export const exerciseTypeValues = [
  "mcq",
  "multi_select",
  "true_false",
  "fill",
  "matching",
  "ordering",
  "numeric",
  "math_expression",
  "short_answer",
  "multi_step",
  "document_analysis",
  "interactive_image",
] as const;

export const partnerTypeValues = ["support_school", "distribution_office"] as const;
export const partnerApplicationStatusValues = ["pending", "under_review", "approved", "rejected", "needs_information", "cancelled"] as const;
export const partnerStatusValues = ["pending_review", "active", "suspended", "inactive", "rejected"] as const;
export const referralStatusValues = ["captured", "registered", "eligible", "converted", "invalid", "reversed"] as const;
export const commissionModelValues = ["marginal_tier", "retroactive_tier"] as const;
export const commissionStatusValues = ["pending", "approved", "paid", "cancelled", "reversed"] as const;
export const payoutStatusValues = ["requested", "under_review", "approved", "paid", "rejected"] as const;
export const payoutMethodValues = ["ccp", "baridimob", "bank_transfer", "other"] as const;

/** Core identity record. A user has one application role in the first release. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoleValues).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const curriculumVersions = mysqlTable("curriculum_versions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  academicYear: varchar("academicYear", { length: 20 }).notNull(),
  level: varchar("level", { length: 120 }).notNull(),
  track: varchar("track", { length: 120 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  archivedAt: timestamp("archivedAt"),
});

export const subjects = mysqlTable(
  "subjects",
  {
    id: int("id").autoincrement().primaryKey(),
    curriculumVersionId: int("curriculumVersionId").notNull().references(() => curriculumVersions.id),
    code: varchar("code", { length: 40 }).notNull(),
    nameAr: varchar("nameAr", { length: 120 }).notNull(),
    taglineAr: varchar("taglineAr", { length: 240 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    isVisible: boolean("isVisible").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    versionSubjectUnique: uniqueIndex("subjects_version_subject_unique").on(table.curriculumVersionId, table.code),
  }),
);

export const subjectSourceGates = mysqlTable(
  "subject_source_gates",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subjectId").notNull().references(() => subjects.id),
    status: mysqlEnum("status", sourceGateValues).default("requires_user_upload").notNull(),
    noteAr: text("noteAr"),
    verifiedAt: timestamp("verifiedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ subjectGateUnique: uniqueIndex("subject_source_gate_unique").on(table.subjectId) }),
);

export const units = mysqlTable(
  "units",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subjectId").notNull().references(() => subjects.id),
    titleAr: varchar("titleAr", { length: 220 }).notNull(),
    summaryAr: text("summaryAr"),
    sortOrder: int("sortOrder").default(0).notNull(),
    isFreeUnit: boolean("isFreeUnit").default(false).notNull(),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ subjectIndex: index("units_subject_index").on(table.subjectId) }),
);

export const lessons = mysqlTable(
  "lessons",
  {
    id: int("id").autoincrement().primaryKey(),
    unitId: int("unitId").notNull().references(() => units.id),
    titleAr: varchar("titleAr", { length: 220 }).notNull(),
    objectiveAr: text("objectiveAr"),
    estimatedMinutes: int("estimatedMinutes"),
    sortOrder: int("sortOrder").default(0).notNull(),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ unitIndex: index("lessons_unit_index").on(table.unitId) }),
);

export const concepts = mysqlTable(
  "concepts",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subjectId").notNull().references(() => subjects.id),
    nameAr: varchar("nameAr", { length: 220 }).notNull(),
    descriptionAr: text("descriptionAr"),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ subjectIndex: index("concepts_subject_index").on(table.subjectId) }),
);

export const skills = mysqlTable(
  "skills",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subjectId").notNull().references(() => subjects.id),
    nameAr: varchar("nameAr", { length: 220 }).notNull(),
    descriptionAr: text("descriptionAr"),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ subjectIndex: index("skills_subject_index").on(table.subjectId) }),
);

export const lessonConcepts = mysqlTable(
  "lesson_concepts",
  {
    id: int("id").autoincrement().primaryKey(),
    lessonId: int("lessonId").notNull().references(() => lessons.id),
    conceptId: int("conceptId").notNull().references(() => concepts.id),
  },
  table => ({ relationUnique: uniqueIndex("lesson_concept_unique").on(table.lessonId, table.conceptId) }),
);

export const lessonSkills = mysqlTable(
  "lesson_skills",
  {
    id: int("id").autoincrement().primaryKey(),
    lessonId: int("lessonId").notNull().references(() => lessons.id),
    skillId: int("skillId").notNull().references(() => skills.id),
  },
  table => ({ relationUnique: uniqueIndex("lesson_skill_unique").on(table.lessonId, table.skillId) }),
);

export const conceptPrerequisites = mysqlTable(
  "concept_prerequisites",
  {
    id: int("id").autoincrement().primaryKey(),
    conceptId: int("conceptId").notNull().references(() => concepts.id),
    prerequisiteConceptId: int("prerequisiteConceptId").notNull().references(() => concepts.id),
  },
  table => ({ relationUnique: uniqueIndex("concept_prerequisite_unique").on(table.conceptId, table.prerequisiteConceptId) }),
);

export const skillDependencies = mysqlTable(
  "skill_dependencies",
  {
    id: int("id").autoincrement().primaryKey(),
    skillId: int("skillId").notNull().references(() => skills.id),
    dependsOnSkillId: int("dependsOnSkillId").notNull().references(() => skills.id),
  },
  table => ({ relationUnique: uniqueIndex("skill_dependency_unique").on(table.skillId, table.dependsOnSkillId) }),
);

export const sources = mysqlTable(
  "sources",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceAuthority: varchar("sourceAuthority", { length: 180 }).notNull(),
    url: varchar("url", { length: 1000 }).notNull(),
    documentTitle: varchar("documentTitle", { length: 500 }).notNull(),
    publicationDate: timestamp("publicationDate"),
    academicYear: varchar("academicYear", { length: 20 }),
    level: varchar("level", { length: 120 }),
    track: varchar("track", { length: 120 }),
    subjectId: int("subjectId").references(() => subjects.id),
    edition: varchar("edition", { length: 120 }),
    sourceVersion: varchar("sourceVersion", { length: 120 }),
    isInternalPilot: boolean("isInternalPilot").default(false).notNull(),
    isUserApprovedWorkingReference: boolean("isUserApprovedWorkingReference").default(false).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", sourceStatusValues).default("unverified").notNull(),
    verificationDate: timestamp("verificationDate"),
    verificationNotes: text("verificationNotes"),
    createdByUserId: int("createdByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    archivedAt: timestamp("archivedAt"),
    archivedByUserId: int("archivedByUserId").references(() => users.id),
  },
  table => ({ subjectIndex: index("sources_subject_index").on(table.subjectId), statusIndex: index("sources_status_index").on(table.verificationStatus), archivedIndex: index("sources_archived_index").on(table.archivedAt) }),
);

export const officialBookUploads = mysqlTable(
  "official_book_uploads",
  {
    id: int("id").autoincrement().primaryKey(),
    subjectId: int("subjectId").notNull().references(() => subjects.id),
    sourceId: int("sourceId").references(() => sources.id),
    fileKey: varchar("fileKey", { length: 600 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 1200 }).notNull(),
    originalFilename: varchar("originalFilename", { length: 500 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    verificationChecklist: json("verificationChecklist"),
    verificationStatus: mysqlEnum("verificationStatus", sourceStatusValues).default("unverified").notNull(),
    uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
  },
  table => ({ subjectIndex: index("official_book_upload_subject_index").on(table.subjectId) }),
);

export const contentAssets = mysqlTable("content_assets", {
  id: int("id").autoincrement().primaryKey(),
  fileKey: varchar("fileKey", { length: 600 }).notNull().unique(),
  fileUrl: varchar("fileUrl", { length: 1200 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  altTextAr: text("altTextAr"),
  annotationData: json("annotationData"),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Visual and annotation assets inherit delivery eligibility from their parent learning record. */
export const learningItemAssets = mysqlTable(
  "learning_item_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    learningItemId: int("learningItemId").notNull().references(() => learningItems.id),
    assetId: int("assetId").notNull().references(() => contentAssets.id),
    sourceId: int("sourceId").references(() => sources.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ relationUnique: uniqueIndex("learning_item_asset_unique").on(table.learningItemId, table.assetId) }),
);

export const learningItems = mysqlTable(
  "learning_items",
  {
    id: int("id").autoincrement().primaryKey(),
    lessonId: int("lessonId").notNull().references(() => lessons.id),
    sourceId: int("sourceId").references(() => sources.id),
    type: varchar("type", { length: 60 }).notNull(),
    titleAr: varchar("titleAr", { length: 240 }).notNull(),
    body: json("body").notNull(),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    authoredByUserId: int("authoredByUserId").references(() => users.id),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ lessonIndex: index("learning_items_lesson_index").on(table.lessonId), workflowIndex: index("learning_items_workflow_index").on(table.workflowState) }),
);

export const mindMaps = mysqlTable("mind_maps", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id),
  sourceId: int("sourceId").references(() => sources.id),
  titleAr: varchar("titleAr", { length: 240 }).notNull(),
  viewport: json("viewport"),
  workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mindMapNodes = mysqlTable(
  "mind_map_nodes",
  {
    id: int("id").autoincrement().primaryKey(),
    mindMapId: int("mindMapId").notNull().references(() => mindMaps.id),
    nodeType: varchar("nodeType", { length: 40 }).notNull(),
    labelAr: varchar("labelAr", { length: 500 }).notNull(),
    content: json("content"),
    positionX: decimal("positionX", { precision: 12, scale: 2 }).notNull(),
    positionY: decimal("positionY", { precision: 12, scale: 2 }).notNull(),
    collapsed: boolean("collapsed").default(false).notNull(),
  },
  table => ({ mindMapIndex: index("mind_map_nodes_map_index").on(table.mindMapId) }),
);

export const mindMapEdges = mysqlTable(
  "mind_map_edges",
  {
    id: int("id").autoincrement().primaryKey(),
    mindMapId: int("mindMapId").notNull().references(() => mindMaps.id),
    sourceNodeId: int("sourceNodeId").notNull().references(() => mindMapNodes.id),
    targetNodeId: int("targetNodeId").notNull().references(() => mindMapNodes.id),
    labelAr: varchar("labelAr", { length: 220 }),
  },
  table => ({ mindMapIndex: index("mind_map_edges_map_index").on(table.mindMapId) }),
);

export const exercises = mysqlTable(
  "exercises",
  {
    id: int("id").autoincrement().primaryKey(),
    lessonId: int("lessonId").notNull().references(() => lessons.id),
    sourceId: int("sourceId").references(() => sources.id),
    type: mysqlEnum("type", exerciseTypeValues).notNull(),
    prompt: json("prompt").notNull(),
    answerDefinition: json("answerDefinition").notNull(),
    solution: json("solution"),
    difficulty: int("difficulty").default(1).notNull(),
    questionOrigin: mysqlEnum("questionOrigin", ["official_bac", "original_bac_style"]).default("original_bac_style").notNull(),
    workflowState: mysqlEnum("workflowState", workflowValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ lessonIndex: index("exercises_lesson_index").on(table.lessonId) }),
);

export const exerciseHints = mysqlTable(
  "exercise_hints",
  {
    id: int("id").autoincrement().primaryKey(),
    exerciseId: int("exerciseId").notNull().references(() => exercises.id),
    ordinal: int("ordinal").notNull(),
    body: json("body").notNull(),
  },
  table => ({ exerciseHintUnique: uniqueIndex("exercise_hint_unique").on(table.exerciseId, table.ordinal) }),
);

export const studentEntitlements = mysqlTable(
  "student_entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    entitlement: varchar("entitlement", { length: 100 }).notNull(),
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  table => ({ userEntitlementUnique: uniqueIndex("student_entitlement_unique").on(table.userId, table.entitlement) }),
);

export const studentPlanAssignments = mysqlTable(
  "student_plan_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    planId: int("planId").notNull().references(() => plans.id),
    productTier: varchar("productTier", { length: 40 }).notNull(),
    selectedSubjects: json("selectedSubjects").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    assignedAt: timestamp("assignedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  table => ({ userTierActiveIndex: index("student_plan_assignment_user_tier_index").on(table.userId, table.productTier, table.isActive) }),
);

export const planChangeAudits = mysqlTable(
  "plan_change_audits",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    actorUserId: int("actorUserId").notNull().references(() => users.id),
    previousPlanId: int("previousPlanId").references(() => plans.id),
    nextPlanId: int("nextPlanId").notNull().references(() => plans.id),
    changeKind: mysqlEnum("changeKind", ["manual_assignment", "upgrade", "promotion"]).default("manual_assignment").notNull(),
    noteAr: text("noteAr"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ userCreatedIndex: index("plan_change_audits_user_created_index").on(table.userId, table.createdAt) }),
);

export const hassemFocusSessions = mysqlTable(
  "hassem_focus_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    sessionType: varchar("sessionType", { length: 40 }).notNull(),
    durationMinutes: int("durationMinutes").notNull(),
    status: varchar("status", { length: 24 }).default("started").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userStatusIndex: index("hassem_focus_session_user_status_index").on(table.userId, table.status, table.startedAt) }),
);

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 160 }).notNull(),
  priceDzd: int("priceDzd").notNull(),
  durationDays: int("durationDays").default(0).notNull(),
  subjectLimit: int("subjectLimit").default(0).notNull(),
  subjectBundle: json("subjectBundle"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const planEntitlements = mysqlTable(
  "plan_entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    planId: int("planId").notNull().references(() => plans.id),
    entitlement: varchar("entitlement", { length: 100 }).notNull(),
  },
  table => ({ planEntitlementUnique: uniqueIndex("plan_entitlement_unique").on(table.planId, table.entitlement) }),
);

export const studentAttempts = mysqlTable(
  "student_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    exerciseId: int("exerciseId").notNull().references(() => exercises.id),
    answerPayload: json("answerPayload").notNull(),
    isCorrect: boolean("isCorrect").notNull(),
    hintsUsed: int("hintsUsed").default(0).notNull(),
    revealedSteps: int("revealedSteps").default(0).notNull(),
    durationSeconds: int("durationSeconds").default(0).notNull(),
    errorType: varchar("errorType", { length: 80 }),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  },
  table => ({ userExerciseIndex: index("student_attempt_user_exercise_index").on(table.userId, table.exerciseId) }),
);

export const errorNotebookEntries = mysqlTable(
  "error_notebook_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    exerciseId: int("exerciseId").references(() => exercises.id),
    conceptId: int("conceptId").references(() => concepts.id),
    errorType: varchar("errorType", { length: 80 }).notNull(),
    explanationAr: text("explanationAr"),
    occurrences: int("occurrences").default(1).notNull(),
    lastOccurredAt: timestamp("lastOccurredAt").defaultNow().notNull(),
    nextReviewAt: timestamp("nextReviewAt"),
  },
  table => ({ userIndex: index("error_notebook_user_index").on(table.userId) }),
);

export const masteryRecords = mysqlTable(
  "mastery_records",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    conceptId: int("conceptId").notNull().references(() => concepts.id),
    status: mysqlEnum("status", masteryValues).default("start").notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).default("0").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userConceptUnique: uniqueIndex("mastery_user_concept_unique").on(table.userId, table.conceptId) }),
);

export const reviewQueueItems = mysqlTable(
  "review_queue_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    conceptId: int("conceptId").references(() => concepts.id),
    exerciseId: int("exerciseId").references(() => exercises.id),
    reason: varchar("reason", { length: 80 }).notNull(),
    dueAt: timestamp("dueAt").notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ userDueIndex: index("review_queue_user_due_index").on(table.userId, table.dueAt) }),
);

export const bacSessions = mysqlTable("bac_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  elapsedSeconds: int("elapsedSeconds").default(0).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["in_progress", "submitted", "analyzed"]).default("in_progress").notNull(),
});

export const hassemFinalMemoryItems = mysqlTable(
  "hassem_final_memory_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    memoryKey: varchar("memoryKey", { length: 40 }).notNull(),
    titleAr: varchar("titleAr", { length: 160 }).notNull(),
    promptAr: text("promptAr").notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userMemoryUnique: uniqueIndex("hassem_final_memory_user_key_unique").on(table.userId, table.memoryKey) }),
);

export const contentReviews = mysqlTable(
  "content_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    learningItemId: int("learningItemId").references(() => learningItems.id),
    exerciseId: int("exerciseId").references(() => exercises.id),
    mindMapId: int("mindMapId").references(() => mindMaps.id),
    decision: mysqlEnum("decision", ["approved", "changes_requested", "rejected"]).notNull(),
    noteAr: text("noteAr"),
    reviewerUserId: int("reviewerUserId").notNull().references(() => users.id),
    reviewedAt: timestamp("reviewedAt").defaultNow().notNull(),
  },
  table => ({ reviewerIndex: index("content_reviews_reviewer_index").on(table.reviewerUserId) }),
);

/** Human-attested operational evidence only; this table cannot approve or publish academic records. */
export const releaseQualityChecks = mysqlTable(
  "release_quality_checks",
  {
    id: int("id").autoincrement().primaryKey(),
    checkKey: mysqlEnum("checkKey", ["academic_batch_qa", "real_account_qa", "operational_qa", "published_bac_session"]).notNull(),
    evidenceNoteAr: text("evidenceNoteAr").notNull(),
    actorUserId: int("actorUserId").notNull().references(() => users.id),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  },
  table => ({ checkRecordedIndex: index("release_quality_checks_key_recorded_index").on(table.checkKey, table.recordedAt) }),
);

/** Public applications are intentionally separate from accounts so an institution can apply before it receives partner access. */
export const partnerApplications = mysqlTable(
  "partner_applications",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerType: mysqlEnum("partnerType", partnerTypeValues).notNull(),
    institutionName: varchar("institutionName", { length: 240 }).notNull(),
    tradeName: varchar("tradeName", { length: 240 }),
    contactName: varchar("contactName", { length: 180 }).notNull(),
    contactPosition: varchar("contactPosition", { length: 160 }),
    phone: varchar("phone", { length: 48 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 48 }),
    email: varchar("email", { length: 320 }),
    wilaya: varchar("wilaya", { length: 120 }).notNull(),
    commune: varchar("commune", { length: 160 }).notNull(),
    address: text("address").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    websiteUrl: varchar("websiteUrl", { length: 1000 }),
    facebookUrl: varchar("facebookUrl", { length: 1000 }),
    notes: text("notes"),
    expectedStudentReach: int("expectedStudentReach").default(0).notNull(),
    discoverySource: varchar("discoverySource", { length: 240 }),
    status: mysqlEnum("status", partnerApplicationStatusValues).default("pending").notNull(),
    reviewNoteAr: text("reviewNoteAr"),
    internalNoteAr: text("internalNoteAr"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    statusCreatedIndex: index("partner_application_status_created_index").on(table.status, table.createdAt),
    areaIndex: index("partner_application_area_index").on(table.wilaya, table.commune),
  }),
);

/** Active distribution profile. userId remains nullable until an approved applicant is linked to a real OAuth account. */
export const partners = mysqlTable(
  "partners",
  {
    id: int("id").autoincrement().primaryKey(),
    applicationId: int("applicationId").references(() => partnerApplications.id),
    userId: int("userId").references(() => users.id),
    partnerType: mysqlEnum("partnerType", partnerTypeValues).notNull(),
    status: mysqlEnum("status", partnerStatusValues).default("pending_review").notNull(),
    institutionName: varchar("institutionName", { length: 240 }).notNull(),
    tradeName: varchar("tradeName", { length: 240 }),
    contactName: varchar("contactName", { length: 180 }).notNull(),
    contactPosition: varchar("contactPosition", { length: 160 }),
    phone: varchar("phone", { length: 48 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 48 }),
    email: varchar("email", { length: 320 }),
    wilaya: varchar("wilaya", { length: 120 }).notNull(),
    commune: varchar("commune", { length: 160 }).notNull(),
    address: text("address").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    websiteUrl: varchar("websiteUrl", { length: 1000 }),
    facebookUrl: varchar("facebookUrl", { length: 1000 }),
    partnerCode: varchar("partnerCode", { length: 64 }).notNull().unique(),
    referralUrl: varchar("referralUrl", { length: 1000 }).notNull(),
    referralActive: boolean("referralActive").default(false).notNull(),
    commissionModel: mysqlEnum("commissionModel", commissionModelValues).default("marginal_tier").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    suspendedAt: timestamp("suspendedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    applicationUnique: uniqueIndex("partner_application_unique").on(table.applicationId),
    userUnique: uniqueIndex("partner_user_unique").on(table.userId),
    statusAreaIndex: index("partner_status_area_index").on(table.status, table.wilaya, table.commune),
  }),
);

export const partnerReferralCodes = mysqlTable(
  "partner_referral_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    code: varchar("code", { length: 80 }).notNull().unique(),
    campaignCode: varchar("campaignCode", { length: 80 }),
    landingPage: varchar("landingPage", { length: 500 }).default("/").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deactivatedAt: timestamp("deactivatedAt"),
  },
  table => ({ partnerIndex: index("partner_referral_code_partner_index").on(table.partnerId, table.isActive) }),
);

/** Captures attribution through registration; no commission can be created until an administrator verifies an eligible paid conversion. */
export const partnerReferrals = mysqlTable(
  "partner_referrals",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    referralCodeId: int("referralCodeId").references(() => partnerReferralCodes.id),
    referralCode: varchar("referralCode", { length: 80 }).notNull(),
    userId: int("userId").references(() => users.id),
    visitorTokenHash: varchar("visitorTokenHash", { length: 128 }),
    campaignCode: varchar("campaignCode", { length: 80 }),
    landingPage: varchar("landingPage", { length: 500 }),
    status: mysqlEnum("status", referralStatusValues).default("captured").notNull(),
    firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
    registeredAt: timestamp("registeredAt"),
    eligibleAt: timestamp("eligibleAt"),
    convertedAt: timestamp("convertedAt"),
    lockedAt: timestamp("lockedAt"),
    invalidReasonAr: text("invalidReasonAr"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    visitorTokenHashUnique: uniqueIndex("partner_referral_visitor_token_unique").on(table.visitorTokenHash),
    userUnique: uniqueIndex("partner_referral_user_unique").on(table.userId),
    userIndex: index("partner_referral_user_index").on(table.userId, table.status),
    partnerStatusIndex: index("partner_referral_partner_status_index").on(table.partnerId, table.status),
  }),
);

/** Configurable marginal tiers. Existing commission rows snapshot their rate so historical amounts never change automatically. */
export const partnerCommissionTiers = mysqlTable(
  "partner_commission_tiers",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerType: mysqlEnum("partnerType", partnerTypeValues).notNull(),
    fromEligibleCount: int("fromEligibleCount").notNull(),
    toEligibleCount: int("toEligibleCount"),
    commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ typeFromUnique: uniqueIndex("partner_commission_tier_type_from_unique").on(table.partnerType, table.fromEligibleCount) }),
);

/** Singleton-style operating configuration. It governs manual review and payout eligibility only, never a payment rail. */
export const partnerOperatingSettings = mysqlTable("partner_operating_settings", {
  id: int("id").autoincrement().primaryKey(),
  verificationDays: int("verificationDays").default(7).notNull(),
  minimumPayoutDzd: int("minimumPayoutDzd").default(2000).notNull(),
  payoutMethods: json("payoutMethods").notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A monetary ledger record may only originate from a verified eligible conversion; it does not initiate money movement. */
export const partnerCommissions = mysqlTable(
  "partner_commissions",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    referralId: int("referralId").notNull().references(() => partnerReferrals.id),
    studentUserId: int("studentUserId").notNull().references(() => users.id),
    studentPlanAssignmentId: int("studentPlanAssignmentId").references(() => studentPlanAssignments.id),
    orderReference: varchar("orderReference", { length: 160 }),
    grossAmountDzd: int("grossAmountDzd").notNull(),
    commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
    commissionAmountDzd: int("commissionAmountDzd").notNull(),
    tierId: int("tierId").notNull().references(() => partnerCommissionTiers.id),
    status: mysqlEnum("status", commissionStatusValues).default("pending").notNull(),
    eligibleAt: timestamp("eligibleAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    approvedByUserId: int("approvedByUserId").references(() => users.id),
    reversedAt: timestamp("reversedAt"),
    reversedByUserId: int("reversedByUserId").references(() => users.id),
    reversalReasonAr: text("reversalReasonAr"),
    notesAr: text("notesAr"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    partnerStatusIndex: index("partner_commission_partner_status_index").on(table.partnerId, table.status, table.createdAt),
    assignmentUnique: uniqueIndex("partner_commission_assignment_unique").on(table.studentPlanAssignmentId),
  }),
);

/** Requests are reviewed manually; destination details are stored only as ciphertext and are never returned to a partner feed. */
export const partnerPayoutRequests = mysqlTable(
  "partner_payout_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    amountDzd: int("amountDzd").notNull(),
    payoutMethod: mysqlEnum("payoutMethod", payoutMethodValues).notNull(),
    paymentDetailsCiphertext: text("paymentDetailsCiphertext").notNull(),
    paymentDetailsIv: varchar("paymentDetailsIv", { length: 64 }).notNull(),
    destinationMasked: varchar("destinationMasked", { length: 180 }).notNull(),
    status: mysqlEnum("status", payoutStatusValues).default("requested").notNull(),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id),
    paidAt: timestamp("paidAt"),
    paidByUserId: int("paidByUserId").references(() => users.id),
    paymentReference: varchar("paymentReference", { length: 240 }),
    reviewNoteAr: text("reviewNoteAr"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ partnerStatusIndex: index("partner_payout_partner_status_index").on(table.partnerId, table.status, table.requestedAt) }),
);

export const partnerPayoutAllocations = mysqlTable(
  "partner_payout_allocations",
  {
    id: int("id").autoincrement().primaryKey(),
    payoutRequestId: int("payoutRequestId").notNull().references(() => partnerPayoutRequests.id),
    commissionId: int("commissionId").notNull().references(() => partnerCommissions.id),
    allocatedAmountDzd: int("allocatedAmountDzd").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ commissionUnique: uniqueIndex("partner_payout_allocation_commission_unique").on(table.commissionId) }),
);

export const partnerAgreements = mysqlTable(
  "partner_agreements",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    agreementDate: timestamp("agreementDate").notNull(),
    commissionPolicy: mysqlEnum("commissionPolicy", commissionModelValues).default("marginal_tier").notNull(),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    status: varchar("status", { length: 48 }).default("draft").notNull(),
    documentReference: varchar("documentReference", { length: 1200 }),
    approvedByUserId: int("approvedByUserId").references(() => users.id),
    approvedAt: timestamp("approvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ partnerIndex: index("partner_agreement_partner_index").on(table.partnerId, table.status) }),
);

export const partnerDocuments = mysqlTable(
  "partner_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull().references(() => partners.id),
    category: varchar("category", { length: 80 }).notNull(),
    fileKey: varchar("fileKey", { length: 600 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 1200 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ partnerCategoryIndex: index("partner_document_partner_category_index").on(table.partnerId, table.category) }),
);

export const partnerAssets = mysqlTable(
  "partner_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").references(() => partners.id),
    category: varchar("category", { length: 80 }).notNull(),
    titleAr: varchar("titleAr", { length: 240 }).notNull(),
    shareCopyAr: text("shareCopyAr"),
    fileKey: varchar("fileKey", { length: 600 }),
    fileUrl: varchar("fileUrl", { length: 1200 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ partnerActiveIndex: index("partner_asset_partner_active_index").on(table.partnerId, table.isActive) }),
);

export const partnerCampaigns = mysqlTable(
  "partner_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").references(() => partners.id),
    campaignCode: varchar("campaignCode", { length: 80 }).notNull().unique(),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    commissionOverrideRate: decimal("commissionOverrideRate", { precision: 5, scale: 2 }),
    promoCode: varchar("promoCode", { length: 80 }),
    status: varchar("status", { length: 48 }).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ partnerStatusIndex: index("partner_campaign_partner_status_index").on(table.partnerId, table.status) }),
);

export const partnerLeads = mysqlTable(
  "partner_leads",
  {
    id: int("id").autoincrement().primaryKey(),
    institutionName: varchar("institutionName", { length: 240 }).notNull(),
    partnerType: mysqlEnum("partnerType", partnerTypeValues).notNull(),
    wilaya: varchar("wilaya", { length: 120 }).notNull(),
    commune: varchar("commune", { length: 160 }),
    contactName: varchar("contactName", { length: 180 }),
    phone: varchar("phone", { length: 48 }),
    source: varchar("source", { length: 160 }),
    status: varchar("status", { length: 48 }).default("lead").notNull(),
    notesAr: text("notesAr"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ statusAreaIndex: index("partner_lead_status_area_index").on(table.status, table.wilaya, table.commune) }),
);

export const partnerAuditLogs = mysqlTable(
  "partner_audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").references(() => partners.id),
    actorUserId: int("actorUserId").references(() => users.id),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId"),
    previousData: json("previousData"),
    nextData: json("nextData"),
    noteAr: text("noteAr"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ partnerCreatedIndex: index("partner_audit_partner_created_index").on(table.partnerId, table.createdAt), actionIndex: index("partner_audit_action_index").on(table.action, table.createdAt) }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

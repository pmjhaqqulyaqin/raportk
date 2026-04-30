import { pgTable, text, integer, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";

// Better Auth Tables
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	role: text("role").default("guru").notNull(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt")
});

// App Tables
export const schoolInfo = pgTable("school_info", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    schoolName: text("school_name"),
    npsn: text("npsn"),
    principal: text("principal"),
    principalNip: text("principal_nip"),
    teacher: text("teacher"),
    teacherNip: text("teacher_nip"),
    academicYear: text("academic_year"),
    semester: text("semester"),
    date: text("date"),
    location: text("location"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }), // Admin user who owns the data
    name: text("name").notNull(),
    teacherId: text("teacher_id").references(() => user.id), // Assigned teacher
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    height: integer("height"),
    weight: integer("weight"),
    phase: text("phase").default('Fondasi').notNull(),
    group: text("group_name").default('A').notNull(),
    gender: text("gender"),
    classId: uuid("class_id").references(() => classes.id, { onDelete: 'set null' }),
    nisn: text("nisn"),
    nik: text("nik"),
    birthPlace: text("birth_place"),
    birthDate: text("birth_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    userIdIdx: index("students_user_id_idx").on(t.userId),
    classIdIdx: index("students_class_id_idx").on(t.classId),
}));

export const reports = pgTable("reports", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
    agama: text("agama"),
    jatiDiri: text("jati_diri"),
    literasi: text("literasi"),
    p5: text("p5"),
    attendanceSick: integer("attendance_sick").default(0),
    attendancePermission: integer("attendance_permission").default(0),
    attendanceUnexcused: integer("attendance_unexcused").default(0),
    parentReflection: text("parent_reflection"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    studentIdIdx: index("reports_student_id_idx").on(t.studentId),
}));

export const templates = pgTable("templates", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    category: text("category").notNull(), // 'Nilai Agama & Budi Pekerti', 'Jati Diri', etc.
    name: text("name").notNull(),
    text: text("text").notNull(),
    phase: text("phase"),           // 'Fondasi' / null (semua fase)
    groupName: text("group_name"),  // 'A' / 'B' / null (semua kelas)
    semester: text("semester"),     // 'Gasal' / 'Genap' / null (semua semester)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// NPSN-Based School Collaboration Tables
// ==========================================

// Master school record — one per NPSN
export const schools = pgTable("schools", {
    id: uuid("id").defaultRandom().primaryKey(),
    npsn: text("npsn").notNull().unique(),
    name: text("name").notNull(),
    address: text("address"),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Membership: user ↔ school relationship
export const schoolMembers = pgTable("school_members", {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: text("role").default("guru").notNull(),  // 'admin' | 'guru'
    classGroup: text("class_group"),               // 'A', 'B', etc.
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Shared templates within a school hub
export const sharedTemplates = pgTable("shared_templates", {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: 'cascade' }),
    schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
    sharedBy: text("shared_by").notNull().references(() => user.id, { onDelete: 'cascade' }),
    isOfficial: boolean("is_official").default(false),
    sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

// Activity log for real-time feed
export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
    actorId: text("actor_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    action: text("action").notNull(),
    payload: text("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    schoolIdIdx: index("activity_logs_school_id_idx").on(t.schoolId),
}));

// Chat messages per school hub (recipientId NULL = group, non-NULL = DM)
export const chatMessages = pgTable("chat_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
    senderId: text("sender_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    recipientId: text("recipient_id"),
    message: text("message").notNull(),
    replyTo: uuid("reply_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    schoolCreatedAtIdx: index("chat_messages_school_time_idx").on(t.schoolId, t.createdAt),
}));

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

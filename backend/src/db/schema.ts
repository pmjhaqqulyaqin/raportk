import { pgTable, text, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
});

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

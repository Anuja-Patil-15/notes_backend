import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user']);
export const featureEnum = pgEnum('feature', ['summary', 'mcq', 'flowchart', 'short_notes']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pdfUploads = pgTable('pdf_uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filename: varchar('filename', { length: 500 }).notNull(),
  originalName: varchar('original_name', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  extractedText: text('extracted_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiResults = pgTable('ai_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  pdfId: uuid('pdf_id').references(() => pdfUploads.id, { onDelete: 'cascade' }).notNull(),
  feature: featureEnum('feature').notNull(),
  result: text('result').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  pdfId: uuid('pdf_id').references(() => pdfUploads.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
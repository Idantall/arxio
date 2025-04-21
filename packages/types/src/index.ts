import { z } from 'zod';

// אנומים
export enum ScanType {
  SAST = 'SAST',
  DAST = 'DAST',
}

export enum ScanStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

// סכמות אימות
export const userAuthSchema = z.object({
  email: z.string().email({ message: 'כתובת אימייל לא תקינה' }),
  password: z
    .string()
    .min(8, { message: 'סיסמה חייבת להיות באורך 8 תווים לפחות' })
    .max(100)
    .regex(/[A-Z]/, { message: 'סיסמה חייבת לכלול אות גדולה' })
    .regex(/[a-z]/, { message: 'סיסמה חייבת לכלול אות קטנה' })
    .regex(/[0-9]/, { message: 'סיסמה חייבת לכלול ספרה' }),
});

export const userRegistrationSchema = userAuthSchema.extend({
  name: z.string().min(2, { message: 'שם חייב להיות באורך 2 תווים לפחות' }),
});

// סכמת פרויקט
export const projectSchema = z.object({
  id: z.string().optional(),
  repoProvider: z.enum(['github', 'gitlab', 'bitbucket']),
  repoOwner: z.string().min(1, { message: 'שם הבעלים נדרש' }),
  repoName: z.string().min(1, { message: 'שם המאגר נדרש' }),
  defaultBranch: z.string().default('main'),
  deployedUrl: z.string().url({ message: 'כתובת URL לא תקינה' }).optional(),
});

// סכמת סריקה
export const scanRequestSchema = z.object({
  projectId: z.string(),
  scanType: z.nativeEnum(ScanType),
});

// סכמת מציאה
export const findingSchema = z.object({
  id: z.string().optional(),
  scanId: z.string().optional(),
  severity: z.nativeEnum(Severity),
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  filePath: z.string().optional(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  url: z.string().optional(),
  resolved: z.boolean().default(false),
});

// טיפוסי TypeScript מבוססי Zod
export type UserAuth = z.infer<typeof userAuthSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type Finding = z.infer<typeof findingSchema>;

// טיפוסים לאירועי WebSocket
export type ScanProgressEvent = {
  type: 'progress';
  status: string;
  projectId: string;
  message: string;
  progress?: number;
};

export type ScanFindingEvent = {
  type: 'finding';
  tool: string;
  projectId: string;
  finding: Finding;
};

export type ScanErrorEvent = {
  type: 'error';
  status: 'error';
  projectId: string;
  message: string;
};

export type ScanEvent = ScanProgressEvent | ScanFindingEvent | ScanErrorEvent; 
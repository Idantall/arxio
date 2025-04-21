import { z } from 'zod';

declare enum ScanType {
    SAST = "SAST",
    DAST = "DAST"
}
declare enum ScanStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}
declare enum Severity {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
    INFO = "INFO"
}
declare const userAuthSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
declare const userRegistrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
} & {
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
declare const projectSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    repoProvider: z.ZodEnum<["github", "gitlab", "bitbucket"]>;
    repoOwner: z.ZodString;
    repoName: z.ZodString;
    defaultBranch: z.ZodDefault<z.ZodString>;
    deployedUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    repoProvider: "github" | "gitlab" | "bitbucket";
    repoOwner: string;
    repoName: string;
    defaultBranch: string;
    id?: string | undefined;
    deployedUrl?: string | undefined;
}, {
    repoProvider: "github" | "gitlab" | "bitbucket";
    repoOwner: string;
    repoName: string;
    id?: string | undefined;
    defaultBranch?: string | undefined;
    deployedUrl?: string | undefined;
}>;
declare const scanRequestSchema: z.ZodObject<{
    projectId: z.ZodString;
    scanType: z.ZodNativeEnum<typeof ScanType>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    scanType: ScanType;
}, {
    projectId: string;
    scanType: ScanType;
}>;
declare const findingSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    scanId: z.ZodOptional<z.ZodString>;
    severity: z.ZodNativeEnum<typeof Severity>;
    ruleId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    filePath: z.ZodOptional<z.ZodString>;
    lineStart: z.ZodOptional<z.ZodNumber>;
    lineEnd: z.ZodOptional<z.ZodNumber>;
    url: z.ZodOptional<z.ZodString>;
    resolved: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    severity: Severity;
    ruleId: string;
    title: string;
    description: string;
    resolved: boolean;
    id?: string | undefined;
    scanId?: string | undefined;
    filePath?: string | undefined;
    lineStart?: number | undefined;
    lineEnd?: number | undefined;
    url?: string | undefined;
}, {
    severity: Severity;
    ruleId: string;
    title: string;
    description: string;
    id?: string | undefined;
    scanId?: string | undefined;
    filePath?: string | undefined;
    lineStart?: number | undefined;
    lineEnd?: number | undefined;
    url?: string | undefined;
    resolved?: boolean | undefined;
}>;
type UserAuth = z.infer<typeof userAuthSchema>;
type UserRegistration = z.infer<typeof userRegistrationSchema>;
type Project = z.infer<typeof projectSchema>;
type ScanRequest = z.infer<typeof scanRequestSchema>;
type Finding = z.infer<typeof findingSchema>;
type ScanProgressEvent = {
    type: 'progress';
    status: string;
    projectId: string;
    message: string;
    progress?: number;
};
type ScanFindingEvent = {
    type: 'finding';
    tool: string;
    projectId: string;
    finding: Finding;
};
type ScanErrorEvent = {
    type: 'error';
    status: 'error';
    projectId: string;
    message: string;
};
type ScanEvent = ScanProgressEvent | ScanFindingEvent | ScanErrorEvent;

export { type Finding, type Project, type ScanErrorEvent, type ScanEvent, type ScanFindingEvent, type ScanProgressEvent, type ScanRequest, ScanStatus, ScanType, Severity, type UserAuth, type UserRegistration, findingSchema, projectSchema, scanRequestSchema, userAuthSchema, userRegistrationSchema };

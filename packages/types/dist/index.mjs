// src/index.ts
import { z } from "zod";
var ScanType = /* @__PURE__ */ ((ScanType2) => {
  ScanType2["SAST"] = "SAST";
  ScanType2["DAST"] = "DAST";
  return ScanType2;
})(ScanType || {});
var ScanStatus = /* @__PURE__ */ ((ScanStatus2) => {
  ScanStatus2["QUEUED"] = "QUEUED";
  ScanStatus2["RUNNING"] = "RUNNING";
  ScanStatus2["SUCCESS"] = "SUCCESS";
  ScanStatus2["ERROR"] = "ERROR";
  return ScanStatus2;
})(ScanStatus || {});
var Severity = /* @__PURE__ */ ((Severity2) => {
  Severity2["CRITICAL"] = "CRITICAL";
  Severity2["HIGH"] = "HIGH";
  Severity2["MEDIUM"] = "MEDIUM";
  Severity2["LOW"] = "LOW";
  Severity2["INFO"] = "INFO";
  return Severity2;
})(Severity || {});
var userAuthSchema = z.object({
  email: z.string().email({ message: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4" }),
  password: z.string().min(8, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05D9\u05D5\u05EA \u05D1\u05D0\u05D5\u05E8\u05DA 8 \u05EA\u05D5\u05D5\u05D9\u05DD \u05DC\u05E4\u05D7\u05D5\u05EA" }).max(100).regex(/[A-Z]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC\u05D4" }).regex(/[a-z]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA \u05E7\u05D8\u05E0\u05D4" }).regex(/[0-9]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05E1\u05E4\u05E8\u05D4" })
});
var userRegistrationSchema = userAuthSchema.extend({
  name: z.string().min(2, { message: "\u05E9\u05DD \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05D1\u05D0\u05D5\u05E8\u05DA 2 \u05EA\u05D5\u05D5\u05D9\u05DD \u05DC\u05E4\u05D7\u05D5\u05EA" })
});
var projectSchema = z.object({
  id: z.string().optional(),
  repoProvider: z.enum(["github", "gitlab", "bitbucket"]),
  repoOwner: z.string().min(1, { message: "\u05E9\u05DD \u05D4\u05D1\u05E2\u05DC\u05D9\u05DD \u05E0\u05D3\u05E8\u05E9" }),
  repoName: z.string().min(1, { message: "\u05E9\u05DD \u05D4\u05DE\u05D0\u05D2\u05E8 \u05E0\u05D3\u05E8\u05E9" }),
  defaultBranch: z.string().default("main"),
  deployedUrl: z.string().url({ message: "\u05DB\u05EA\u05D5\u05D1\u05EA URL \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4" }).optional()
});
var scanRequestSchema = z.object({
  projectId: z.string(),
  scanType: z.nativeEnum(ScanType)
});
var findingSchema = z.object({
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
  resolved: z.boolean().default(false)
});
export {
  ScanStatus,
  ScanType,
  Severity,
  findingSchema,
  projectSchema,
  scanRequestSchema,
  userAuthSchema,
  userRegistrationSchema
};

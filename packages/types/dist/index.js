"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ScanStatus: () => ScanStatus,
  ScanType: () => ScanType,
  Severity: () => Severity,
  findingSchema: () => findingSchema,
  projectSchema: () => projectSchema,
  scanRequestSchema: () => scanRequestSchema,
  userAuthSchema: () => userAuthSchema,
  userRegistrationSchema: () => userRegistrationSchema
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
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
var userAuthSchema = import_zod.z.object({
  email: import_zod.z.string().email({ message: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4" }),
  password: import_zod.z.string().min(8, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05D9\u05D5\u05EA \u05D1\u05D0\u05D5\u05E8\u05DA 8 \u05EA\u05D5\u05D5\u05D9\u05DD \u05DC\u05E4\u05D7\u05D5\u05EA" }).max(100).regex(/[A-Z]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC\u05D4" }).regex(/[a-z]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA \u05E7\u05D8\u05E0\u05D4" }).regex(/[0-9]/, { message: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC \u05E1\u05E4\u05E8\u05D4" })
});
var userRegistrationSchema = userAuthSchema.extend({
  name: import_zod.z.string().min(2, { message: "\u05E9\u05DD \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05D1\u05D0\u05D5\u05E8\u05DA 2 \u05EA\u05D5\u05D5\u05D9\u05DD \u05DC\u05E4\u05D7\u05D5\u05EA" })
});
var projectSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  repoProvider: import_zod.z.enum(["github", "gitlab", "bitbucket"]),
  repoOwner: import_zod.z.string().min(1, { message: "\u05E9\u05DD \u05D4\u05D1\u05E2\u05DC\u05D9\u05DD \u05E0\u05D3\u05E8\u05E9" }),
  repoName: import_zod.z.string().min(1, { message: "\u05E9\u05DD \u05D4\u05DE\u05D0\u05D2\u05E8 \u05E0\u05D3\u05E8\u05E9" }),
  defaultBranch: import_zod.z.string().default("main"),
  deployedUrl: import_zod.z.string().url({ message: "\u05DB\u05EA\u05D5\u05D1\u05EA URL \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4" }).optional()
});
var scanRequestSchema = import_zod.z.object({
  projectId: import_zod.z.string(),
  scanType: import_zod.z.nativeEnum(ScanType)
});
var findingSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  scanId: import_zod.z.string().optional(),
  severity: import_zod.z.nativeEnum(Severity),
  ruleId: import_zod.z.string(),
  title: import_zod.z.string(),
  description: import_zod.z.string(),
  filePath: import_zod.z.string().optional(),
  lineStart: import_zod.z.number().optional(),
  lineEnd: import_zod.z.number().optional(),
  url: import_zod.z.string().optional(),
  resolved: import_zod.z.boolean().default(false)
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScanStatus,
  ScanType,
  Severity,
  findingSchema,
  projectSchema,
  scanRequestSchema,
  userAuthSchema,
  userRegistrationSchema
});

// Mock database for MVP - Will be replaced by Supabase

import { Project } from "@arxio/types";

// Mock project data
const projects: (Project & { userId: string, createdAt: string, updatedAt: string })[] = [
  {
    id: "1",
    name: "Demo Project",
    description: "זהו פרויקט הדגמה עבור ARXIO",
    repositoryType: "github",
    repositoryUrl: "https://github.com/arxio/demo-project",
    branch: "main",
    localPath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "1"
  }
];

// Mock user data
const users = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    image: null,
    passwordHash: "demo123", // Plaintext for demo only
  }
];

// Mock database interface
export const db = {
  user: {
    findUnique: async ({ where }: { where: { email?: string, id?: string } }) => {
      if (where.email) {
        return users.find(u => u.email === where.email) || null;
      }
      if (where.id) {
        return users.find(u => u.id === where.id) || null;
      }
      return null;
    },
    create: async ({ data }: { data: any }) => {
      const newUser = { id: String(users.length + 1), ...data };
      users.push(newUser);
      return newUser;
    },
  },
  project: {
    findMany: async ({ where }: { where: { userId?: string } }) => {
      if (where.userId) {
        return projects.filter(p => p.userId === where.userId);
      }
      return projects;
    },
    create: async ({ data }: { data: any }) => {
      const newProject = { 
        id: String(projects.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data 
      };
      projects.push(newProject as any);
      return newProject;
    },
  }
}; 
import { Project } from "@arxio/types";
import { db } from "../db";

// Get all projects for the current user
export async function getUserProjects(): Promise<Project[]> {
  try {
    // In a real app, we would get the current user from session
    const userId = "1"; // Demo user ID
    const projects = await db.project.findMany({ where: { userId } });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

// Get a specific project by ID
export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`);
  }

  return response.json();
}

// Create a new project
export async function createProject(projectData: Omit<Project, "id">): Promise<Project> {
  try {
    // In a real app, we would get the current user from session
    const userId = "1"; // Demo user ID
    const project = await db.project.create({
      data: {
        ...projectData,
        userId,
      },
    });
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
}

// Update an existing project
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }

  return response.json();
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  console.log(`Mock deleting project ${id}`);
  // In a real app, we would call the API to delete the project
}

// Start a scan for a project
export async function startProjectScan(projectId: string, scanType: 'SAST' | 'DAST'): Promise<{ scanId: string }> {
  const response = await fetch(`/api/projects/${projectId}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scanType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start scan: ${response.statusText}`);
  }

  return response.json();
} 
import { Metadata } from "next";
import { ProjectForm } from "./project-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "New Project - ARXIO",
  description: "Add a new project for security scanning",
};

export default async function NewProjectPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Project</h1>
        <p className="text-muted-foreground mt-2">
          Connect a repository to start scanning for security vulnerabilities
        </p>
      </div>
      <div className="max-w-2xl">
        <ProjectForm />
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Project } from "@arxio/types";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@arxio/ui";
import { deleteProject } from "@/lib/api/projects";
import { useRouter } from "next/navigation";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to delete project:", error);
      setIsDeleting(false);
    }
  }

  return (
    <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/dashboard" className="mr-4">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center">
            {project.repoName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.repoProvider} / {project.repoOwner} / {project.defaultBranch}
          </p>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
} 
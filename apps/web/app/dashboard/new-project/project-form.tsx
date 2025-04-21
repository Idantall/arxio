"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@arxio/types";
import { Button, Card, CardContent } from "@arxio/ui";
import { createProject } from "@/lib/api/projects";

export function ProjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      repoProvider: "github",
      repoOwner: "",
      repoName: "",
      defaultBranch: "main",
      deployedUrl: "",
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    setError(null);

    try {
      const project = await createProject(data);
      router.push(`/project/${project.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="repoProvider"
                className="block text-sm font-medium mb-1"
              >
                Repository Provider
              </label>
              <select
                id="repoProvider"
                className="w-full p-2 border rounded-md"
                {...register("repoProvider")}
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="bitbucket">Bitbucket</option>
              </select>
              {errors.repoProvider && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.repoProvider.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="repoOwner"
                className="block text-sm font-medium mb-1"
              >
                Repository Owner / Organization
              </label>
              <input
                id="repoOwner"
                className="w-full p-2 border rounded-md"
                placeholder="e.g., 'facebook'"
                {...register("repoOwner")}
              />
              {errors.repoOwner && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.repoOwner.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="repoName"
                className="block text-sm font-medium mb-1"
              >
                Repository Name
              </label>
              <input
                id="repoName"
                className="w-full p-2 border rounded-md"
                placeholder="e.g., 'react'"
                {...register("repoName")}
              />
              {errors.repoName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.repoName.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="defaultBranch"
                className="block text-sm font-medium mb-1"
              >
                Default Branch
              </label>
              <input
                id="defaultBranch"
                className="w-full p-2 border rounded-md"
                placeholder="e.g., 'main' or 'master'"
                {...register("defaultBranch")}
              />
              {errors.defaultBranch && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.defaultBranch.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="deployedUrl"
                className="block text-sm font-medium mb-1"
              >
                Deployed URL (optional)
              </label>
              <input
                id="deployedUrl"
                className="w-full p-2 border rounded-md"
                placeholder="https://your-app.example.com"
                {...register("deployedUrl")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Required for DAST scans. Leave blank if you only want SAST.
              </p>
              {errors.deployedUrl && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.deployedUrl.message?.toString()}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
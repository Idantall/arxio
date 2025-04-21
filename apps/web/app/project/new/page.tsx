"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@arxio/ui";
import { GithubIcon, FolderIcon, GitBranchIcon, AlertCircleIcon, InfoIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "שם הפרויקט חייב להכיל לפחות 3 תווים",
  }),
  description: z.string().optional(),
  repositoryType: z.enum(["github", "gitlab", "bitbucket", "local"]),
  repositoryUrl: z.string().url({
    message: "יש להזין כתובת URL תקינה",
  }).optional().or(z.literal("")),
  branch: z.string().optional(),
  localPath: z.string().optional(),
});

export default function NewProjectPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      repositoryType: "github",
      repositoryUrl: "",
      branch: "main",
      localPath: "",
    },
  });
  
  const watchRepoType = form.watch("repositoryType");
  const isLocalRepo = watchRepoType === "local";
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description || "",
          repositoryType: values.repositoryType,
          repositoryUrl: !isLocalRepo ? values.repositoryUrl : null,
          branch: !isLocalRepo ? values.branch : null,
          localPath: isLocalRepo ? values.localPath : null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "שגיאה בעת יצירת הפרויקט");
      }
      
      const data = await response.json();
      router.push(`/project/${data.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה אירעה");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">יצירת פרויקט חדש</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">פרטי הפרויקט</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הפרויקט</FormLabel>
                    <FormControl>
                      <Input placeholder="הזן שם לפרויקט" {...field} />
                    </FormControl>
                    <FormDescription>
                      שם הפרויקט שישמש אותך לזיהוי קל בממשק המשתמש
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאור</FormLabel>
                    <FormControl>
                      <Textarea placeholder="תיאור קצר של הפרויקט (אופציונלי)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="repositoryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג מאגר</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג מאגר" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                        <SelectItem value="bitbucket">Bitbucket</SelectItem>
                        <SelectItem value="local">תיקייה מקומית</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isLocalRepo && (
                <>
                  <FormField
                    control={form.control}
                    name="repositoryUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת המאגר</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <GithubIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="https://github.com/username/repo" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          הכתובת של מאגר הקוד שברצונך לסרוק
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ענף (branch)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <GitBranchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="main" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          הענף שיסרק במאגר הקוד (ברירת המחדל: main)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {isLocalRepo && (
                <FormField
                  control={form.control}
                  name="localPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>נתיב מקומי</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FolderIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="C:\path\to\project" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        הנתיב המלא לתיקיית הפרויקט במחשב המקומי
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {error && (
                <div className="flex items-center p-3 text-sm bg-destructive/15 text-destructive rounded-md">
                  <AlertCircleIcon className="h-5 w-5 ml-2 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex items-center p-3 text-sm bg-blue-500/15 text-blue-500 rounded-md">
                <InfoIcon className="h-5 w-5 ml-2 shrink-0" />
                <p>לאחר יצירת הפרויקט תוכל להתחיל בסריקה ולצפות בתוצאות בזמן אמת</p>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="ml-2"
          >
            ביטול
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "יוצר פרויקט..." : "צור פרויקט"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
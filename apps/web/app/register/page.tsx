"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@arxio/ui";
import { LockIcon, MailIcon, UserIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "שם משתמש חייב להכיל לפחות 2 תווים",
  }),
  email: z.string().email({
    message: "נא להזין כתובת אימייל תקינה",
  }),
  password: z.string().min(8, {
    message: "סיסמה חייבת להכיל לפחות 8 תווים",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        form.setError("root", {
          message: errorData.message || "שגיאה בעת הרישום. נסה שנית.",
        });
        return;
      }

      // Registration successful
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration error:", error);
      form.setError("root", {
        message: "שגיאה בעת הרישום. נסה שנית.",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image 
            src="/logo.svg" 
            alt="ARXIO Logo" 
            width={120} 
            height={40} 
            className="mx-auto" 
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            הרשמה ל-ARXIO
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            צור חשבון חדש כדי להתחיל לסרוק את הפרויקטים שלך
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">פרטי חשבון</CardTitle>
            <CardDescription className="text-center">
              נא למלא את הפרטים הבאים כדי ליצור חשבון
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מלא</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="ישראל ישראלי" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>אימייל</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="you@example.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סיסמה</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input type="password" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>אימות סיסמה</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input type="password" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.formState.errors.root && (
                  <div className="text-sm font-medium text-destructive">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "מתבצע רישום..." : "הרשמה"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm">
              יש לך כבר חשבון?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                התחבר
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 
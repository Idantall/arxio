import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { userAuthSchema } from "@arxio/types";
import { supabase, supabaseAdmin } from "./supabase";

// בדיקה שהסוד של NextAuth מוגדר תמיד
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('אזהרה: NEXTAUTH_SECRET לא מוגדר. נשתמש בסוד זמני. זה לא בטוח לסביבת ייצור.');
}

// וידוא שכתובת NextAuth מוגדרת כראוי
const nextAuthUrl = process.env.NEXTAUTH_URL || (
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
);

// לוג של ההגדרות לצורכי דיבוג
console.log('הגדרות אימות:');
console.log('- NextAuth URL:', nextAuthUrl);
console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'מוגדר' : 'לא מוגדר');
console.log('- GitHub credentials:', process.env.GITHUB_CLIENT_ID ? 'מוגדר' : 'לא מוגדר');

export const authConfig: AuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 ימים
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true, // מאפשר התחברות עם אימייל קיים
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        try {
          // וידוא תקינות הפרטים
          const parsedCredentials = userAuthSchema.safeParse(credentials);
          
          if (!parsedCredentials.success) {
            console.error("פורמט פרטי התחברות שגוי:", parsedCredentials.error);
            return null;
          }
          
          const { email, password } = parsedCredentials.data;
          
          console.log(`ניסיון התחברות עם אימייל: ${email}`);
          
          // התחברות ישירה עם Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            console.error("שגיאת אימות ב-Supabase:", error.message);
            return null;
          }
          
          if (!data.user) {
            console.error("לא הוחזר משתמש מ-Supabase");
            return null;
          }
          
          console.log("המשתמש אומת בהצלחה:", data.user.id);
          
          // וידוא שהמשתמש קיים גם בטבלת users
          await syncUserWithUsersTable(data.user);
          
          return {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'משתמש',
            email: data.user.email,
            image: data.user.user_metadata?.avatar_url,
          };
        } catch (error) {
          console.error("שגיאת הרשאה:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // עבור התחברות גיטהאב, צריך לוודא שהמשתמש נמצא גם בטבלת users
      if (account?.provider === 'github' && user) {
        try {
          // בדיקה אם המשתמש קיים ב-Supabase
          const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
            filter: {
              email: user.email || '',
            }
          });
          
          let supabaseUser = existingUsers?.users?.[0];
          
          // יצירת משתמש חדש ב-Supabase אם לא קיים
          if (!supabaseUser) {
            console.log("יצירת משתמש ב-Supabase מהתחברות גיטהאב");
            
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: user.email || '',
              email_confirm: true,
              user_metadata: {
                name: user.name,
                avatar_url: user.image,
                provider: 'github'
              }
            });
            
            if (createError) {
              console.error("שגיאה ביצירת משתמש:", createError);
              return false;
            }
            
            if (newUser?.user) {
              // הגדרת ה-ID הנכון
              user.id = newUser.user.id;
              supabaseUser = newUser.user;
            }
          } else {
            // עדכון ה-ID של המשתמש
            user.id = supabaseUser.id;
          }
          
          // וידוא שהמשתמש קיים בטבלת users
          if (supabaseUser) {
            await syncUserWithUsersTable(supabaseUser);
          }
          
        } catch (error) {
          console.error("שגיאה בהתחברות גיטהאב:", error);
          return false;
        }
      }
      
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'temporarysecret123!@#',
};

// פונקציית עזר להבטחת קיום המשתמש בטבלת 'users'
async function syncUserWithUsersTable(user: any) {
  try {
    // בדיקה אם המשתמש קיים בטבלת users
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (checkError || !existingUser) {
      // תחילה נבדוק אם טבלת users קיימת וניצור אותה אם לא
      const { error: tableError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.message.includes('relation "users" does not exist')) {
        console.log("יוצר טבלת משתמשים...");
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
          
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "משתמשים יכולים לראות את הנתונים שלהם" 
            ON public.users 
            FOR SELECT 
            USING (auth.uid() = id);
            
          CREATE POLICY "Service roles יכולים לעשות הכל" 
            ON public.users 
            USING (auth.role() = 'service_role');
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('pgql', { query: createTableSQL });
        
        if (createError) {
          console.error("שגיאה ביצירת טבלת משתמשים:", createError);
          return;
        }
      }
      
      // הוספת המשתמש לטבלת users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'משתמש',
          avatar_url: user.user_metadata?.avatar_url,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("שגיאה בהוספת המשתמש לטבלת users:", insertError);
      } else {
        console.log("המשתמש נוסף לטבלת users:", user.id);
      }
    }
  } catch (error) {
    console.error("שגיאה בסנכרון המשתמש עם טבלת users:", error);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig); 
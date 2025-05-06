import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import { compare } from "bcryptjs";
import type { User } from "next-auth";

// לוג קונפיגורציה
console.log('קונפיגורציית NextAuth נטענת...');
console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'לא מוגדר'}`);
console.log(`GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? 'מוגדר' : 'לא מוגדר'}`);

const handler = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "Iv23lilRpILDJ1O5enls",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "3823653945db788d4cf53ad06caecaf59068d044",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("חסרים פרטי התחברות");
        }

        console.log(`מנסה להתחבר עם משתמש: ${credentials.email}`);

        try {
          // Try direct Supabase auth first (more reliable)
          try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password
            });
            
            if (!authError && authData.user) {
              console.log('התחברות Supabase ישירה הצליחה:', authData.user.id);
              
              // Check if user exists in users table, create if not
              const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();
                
              if (!existingUser) {
                // Create user record if it doesn't exist
                await supabaseAdmin
                  .from('users')
                  .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    username: authData.user.email?.split('@')[0] || 'user',
                    plan: 'free',
                    created_at: new Date().toISOString()
                  });
              }
              
              return {
                id: authData.user.id,
                email: authData.user.email,
                name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'user',
                image: authData.user.user_metadata?.avatar_url
              };
            }
          } catch (directAuthError) {
            console.log('שגיאה בניסיון התחברות ישיר:', directAuthError);
            // Continue to legacy auth method if direct auth fails
          }

          // Legacy auth method - using users table
          const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .limit(1);

          if (userError) {
            console.error('שגיאה בחיפוש משתמש:', userError.message);
            throw new Error("אירעה שגיאה. נסה שוב מאוחר יותר.");
          }

          if (!users || users.length === 0) {
            console.error('משתמש לא נמצא');
            throw new Error("פרטי התחברות שגויים");
          }

          const user = users[0];
          
          // בדיקת הסיסמה - רק אם יש סיסמה מאוחסנת
          if (user.password) {
            try {
              const isPasswordValid = await compare(credentials.password, user.password);
              
              if (!isPasswordValid) {
                console.error('סיסמה שגויה');
                throw new Error("פרטי התחברות שגויים");
              }
            } catch (passwordError) {
              console.error('שגיאה בבדיקת סיסמה:', passwordError);
              throw new Error("אירעה שגיאה באימות. נסה שוב.");
            }
          } else {
            // אם אין סיסמה בטבלת users, נשתמש באימות של supabase
            console.log('אין סיסמה בטבלת users, מנסה להשתמש ב-Supabase Auth');
            throw new Error("משתמש ללא סיסמה. נסה להתחבר באמצעות Supabase או GitHub");
          }

          console.log('משתמש מזוהה:', user.id, user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            image: user.avatar_url
          };
        } catch (error) {
          console.error('שגיאה באימות משתמש:', error instanceof Error ? error.message : String(error));
          throw new Error(error instanceof Error ? error.message : "אירעה שגיאה בתהליך האימות");
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    session: ({ session, token }) => {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // סנכרון משתמש בין NextAuth לסופאבייס
    async signIn({ user }: { user: User & { email?: string | null } }) {
      if (!user?.email) return true;
      
      // ניסיון למצוא משתמש בסופאבייס לפי האימייל
      try {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users.find(
          u => u.email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        // אם המשתמש לא נמצא, נוצר אותו
        if (!authUser) {
          const randomPassword = Math.random().toString(36).slice(-10);
          await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: { 
              name: user.name, 
              avatar_url: user.image 
            }
          });
        }
        
        // בדיקה אם רשומת המשתמש קיימת בטבלת users
        const supabaseId = authUser?.id;
        if (supabaseId) {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', supabaseId)
            .maybeSingle();
          
          if (!existingUser) {
            // יצירת רשומה בטבלה
            await supabaseAdmin
              .from('users')
              .insert({
                id: supabaseId,
                email: user.email?.toLowerCase(),
                username: user.name || user.email?.split('@')[0],
                avatar_url: user.image,
                plan: 'free',
                created_at: new Date().toISOString()
              });
          }
          
          // עדכון מזהה הסופאבייס כדי שהוא יהיה המזהה בNextAuth
          if (user.id !== supabaseId) {
            user.id = supabaseId;
          }
        }
      } catch (error) {
        console.error('שגיאה בסנכרון משתמש:', error);
      }
      
      return true;
    }
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import { compare } from "bcryptjs";

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
          // 1. חיפוש המשתמש בטבלת users
          const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .limit(1)
            .single();

          if (userError) {
            console.error('שגיאה בחיפוש משתמש:', userError.message);
            throw new Error("אירעה שגיאה. נסה שוב מאוחר יותר.");
          }

          if (!users) {
            console.error('משתמש לא נמצא');
            throw new Error("פרטי התחברות שגויים");
          }

          // 2. בדיקת הסיסמה
          const isPasswordValid = await compare(credentials.password, users.password);

          if (!isPasswordValid) {
            console.error('סיסמה שגויה');
            throw new Error("פרטי התחברות שגויים");
          }

          console.log('משתמש מזוהה:', users.id, users.email);

          // 3. החזרת נתוני המשתמש לאחר אימות מוצלח
          return {
            id: users.id,
            email: users.email,
            name: users.username,
            image: users.avatar_url
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
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 
import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { userAuthSchema } from "@arxio/types";

// Mock user for MVP
const mockUsers = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    image: null,
    passwordHash: "demo123", // Just for demo purposes
  }
];

const authConfig: AuthOptions = {
  // Removed PrismaAdapter
  session: {
    strategy: "jwt",
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
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate credentials
        const parsedCredentials = userAuthSchema.safeParse(credentials);
        
        if (!parsedCredentials.success) {
          return null;
        }
        
        const { email, password } = parsedCredentials.data;
        
        // Use mock data instead of database
        const user = mockUsers.find(u => u.email === email);
        
        if (!user || !user.passwordHash) {
          return null;
        }
        
        // Simple password check for MVP
        const isValidPassword = user.passwordHash === password || 
                               // Demo option - allow "demo123" password
                               password === "demo123";
        
        if (!isValidPassword) {
          return null;
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      // You can modify the token if needed
      return token;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig); 
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "Iv23lilRpILDJ1O5enls",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "3823653945db788d4cf53ad06caecaf59068d044",
    }),
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
});

export { handler as GET, handler as POST }; 
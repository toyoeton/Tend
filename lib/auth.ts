import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";

type GoogleProfile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: env("GOOGLE_CLIENT_ID"),
      clientSecret: env("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent"
        }
      },
      httpOptions: {
        timeout: 10000
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "google") return false;
      const googleProfile = profile as GoogleProfile;
      if (!googleProfile.email) return false;

      const user = await prisma.user.upsert({
        where: { email: googleProfile.email },
        update: {
          googleId: googleProfile.sub,
          name: googleProfile.name ?? googleProfile.email,
          image: googleProfile.picture
        },
        create: {
          googleId: googleProfile.sub,
          name: googleProfile.name ?? googleProfile.email,
          email: googleProfile.email,
          image: googleProfile.picture
        }
      });

      if (account.refresh_token && user.role === Role.PROVIDER) {
        await prisma.providerProfile.updateMany({
          where: { userId: user.id },
          data: {
            googleRefreshToken: encryptSecret(account.refresh_token),
            googleCalendarSynced: true
          }
        });
      }

      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const user = await prisma.user.findUnique({
        where: { email: token.email },
        select: { id: true, role: true, name: true, email: true, image: true }
      });
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as Role | null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
    newUser: "/onboarding"
  }
};

export function hasRole(user: NextAuthUser | undefined, role: Role): boolean {
  return user?.role === role;
}

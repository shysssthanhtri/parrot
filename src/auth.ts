import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { prisma } from "@/prisma";

import { ROOT_ROUTES, ROUTES } from "./app/configs/routes";
import { env } from "./lib/env";

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  callbacks: {
    authorized({ auth, request }) {
      if (!request.nextUrl.pathname.startsWith(ROOT_ROUTES.CMS)) {
        return true;
      }

      if (!auth?.user) {
        return NextResponse.redirect(
          new URL(ROUTES.PUBLIC.SIGNIN, request.nextUrl)
        );
      }

      if (!auth.user.isCmsUser) {
        return NextResponse.redirect(
          new URL(ROUTES.PUBLIC.FORBIDDEN, request.nextUrl)
        );
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.sub) {
        return session;
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isCmsUser: true,
        },
      });

      if (!user) {
        return session;
      }

      session.user.id = user.id;
      session.user.email = user.email;
      session.user.name = user.name;
      session.user.image = user.image;
      session.user.isCmsUser = user.isCmsUser;

      return session;
    },
  },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isCmsUser: user.isCmsUser,
        };
      },
    }),
  ],
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
});

import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/prisma";

import { ROOT_ROUTES, ROUTES } from "./app/configs/routes";
import { env } from "./lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.isCmsUser = user.isCmsUser;
      return session;
    },
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
  },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  secret: env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
});

import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/prisma";

import { ROOT_ROUTES } from "./app/configs/routes";
import { env } from "./lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    authorized({ auth, request }) {
      if (!request.nextUrl.pathname.startsWith(ROOT_ROUTES.CMS)) {
        return true;
      }

      if (auth?.user) {
        return true;
      }

      return NextResponse.redirect(new URL("/", request.nextUrl));
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

import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={ROUTES.PUBLIC.HOME}
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image
            src="/icon.svg"
            alt="Parrot"
            width={24}
            height={24}
            className="size-6 rounded-md"
          />
          Parrot
        </Link>
        {children}
      </div>
    </div>
  );
}

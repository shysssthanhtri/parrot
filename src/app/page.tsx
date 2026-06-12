import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center gap-3 p-6">
      <Button asChild variant="outline">
        <Link href={ROUTES.PUBLIC.SIGNIN}>Sign in</Link>
      </Button>
      <Button asChild>
        <Link href={ROUTES.PUBLIC.SIGNUP}>Sign up</Link>
      </Button>
    </div>
  );
}

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button type="submit">Signin</Button>
    </form>
  );
}

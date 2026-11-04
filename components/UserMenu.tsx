import { connection } from "next/server";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function UserMenu() {
  // The signed-in user is different for every visitor, so never prepare this ahead of time
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const email = typeof data.claims.email === "string" ? data.claims.email : "Signed in";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted">{email}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-line px-3 py-1 hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}


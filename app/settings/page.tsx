import { redirect } from "next/navigation";

import { auth } from "@/auth";

// auth() gates the route in-page (defence in depth alongside the middleware) so
// the root layout can stay static.
export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/sign-in");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-mono">
      <div className="text-center space-y-4">
        <p className="text-cyan-400 text-sm tracking-widest uppercase font-mono">SETTINGS</p>
        <div className="text-2xl font-mono text-cyan-200 animate-pulse">$ status</div>
        <p className="text-muted-foreground text-sm font-mono mt-4">&gt; coming soon</p>
      </div>
    </div>
  );
}

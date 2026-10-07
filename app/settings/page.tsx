import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageShell } from "@/components/page-shell";
import { Panel } from "@/components/ui/panel";

// auth() gates the route in-page (defence in depth alongside the middleware) so
// the root layout can stay static.
export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/sign-in");

  return (
    <PageShell>
      <h1>Settings</h1>
      <Panel>
        <p>There is nothing to set yet.</p>
      </Panel>
    </PageShell>
  );
}

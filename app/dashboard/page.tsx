import { redirect } from "next/navigation";

import { auth } from "@/auth";

// The old editor dashboard template was removed. The product entry point is the
// playground gallery. auth() here gates the route in-page (defence in depth
// alongside the middleware) so the root layout can stay static.
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/sign-in");
  redirect("/playgrounds");
}

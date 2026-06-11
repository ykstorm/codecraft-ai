import { redirect } from "next/navigation";

// The old chai-vibe-editor dashboard template was removed. The product entry
// point is the playground gallery.
export default function DashboardPage() {
  redirect("/playgrounds");
}

import { PageShell } from "@/components/page-shell";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}

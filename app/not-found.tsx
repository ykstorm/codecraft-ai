import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { Panel } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <PageShell>
      <h1>Page not found</h1>
      <Panel>
        <p>
          Nothing is published at this address. Try the <Link href="/">home page</Link> or
          the <Link href="/playgrounds">playgrounds</Link>.
        </p>
      </Panel>
    </PageShell>
  );
}

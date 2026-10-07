import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { Panel } from "@/components/ui/panel";

// An unknown template slug answers 200 with this page. The smoke test looks
// for the "Template not found" wording, so keep it.
export function TemplateNotFound() {
  return (
    <PageShell>
      <h1>Template not found</h1>
      <Panel>
        <p>
          No template has that name. <Link href="/playgrounds">See the playgrounds</Link> for
          the ones that run.
        </p>
      </Panel>
    </PageShell>
  );
}

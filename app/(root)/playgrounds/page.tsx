import Link from "next/link";

import playgrounds from "@/data/playgrounds.json";
import { Panel } from "@/components/ui/panel";

// Every template in the registry boots end to end; none is listed before it does.
const count =
  playgrounds.length === 1 ? "One template is live." : `${playgrounds.length} templates are live.`;

export default function PlaygroundsPage() {
  return (
    <>
      <h1>Playgrounds</h1>
      <p className="lede">
        {count} Others are added only when they boot end to end.
      </p>
      <ul>
        {playgrounds.map((t) => (
          <li key={t.slug}>
            <Panel title={t.name}>
              <p>{t.description}</p>
              <p className="meta">Live. Uses {t.tags.join(", ")}.</p>
              <div className="row">
                <Link href={`/playground/${t.slug}`} className="button">
                  Open {t.name}
                </Link>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </>
  );
}

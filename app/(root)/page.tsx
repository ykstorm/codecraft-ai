import Link from "next/link";

import playgrounds from "@/data/playgrounds.json";
import { Panel } from "@/components/ui/panel";
import { ShellDemo } from "@/components/ui/shell-demo";

const starter = playgrounds[0];

const STACK = [
  "Next.js 16 and React 19 in TypeScript for the host pages",
  "WebContainers (@webcontainer/api) for Node.js inside the tab",
  "Monaco, bundled with the app instead of loaded from a CDN",
  "xterm.js, wired to the container's jsh shell",
  "react-resizable-panels for the three panes",
  "Vite and React 18 for the project that runs in the container",
];

export default function Home() {
  return (
    <>
      <h1>Codecraft</h1>
      <p>
        An in-browser IDE. A Vite + React dev server runs inside the browser tab
        through WebContainers, with a Monaco editor, an xterm terminal and a live
        preview. There is no server behind the editor: the dev server runs on the
        visitor&apos;s machine, in a sandbox the browser isolates with COOP and
        COEP headers.
      </p>
      <div className="row">
        <Link href={`/playground/${starter.slug}`} className="button">
          Open the {starter.name} playground
        </Link>
        <p className="meta">
          The first visit runs npm install in your tab and is slow. Later visits
          restore a stored snapshot when it fits the storage budget.
        </p>
      </div>

      <ShellDemo />

      <Panel title="Stack">
        <ul className="list">
          {STACK.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

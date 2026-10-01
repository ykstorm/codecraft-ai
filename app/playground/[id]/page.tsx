import { redirect } from "next/navigation";

import playgroundsData from "@/data/playgrounds.json";
import { WebPlayground } from "@/components/playground/web-playground";
import { TemplateNotFound } from "@/components/playground/template-not-found";

type Template = {
  slug: string;
  name: string;
  tagline: string;
};

const templates = playgroundsData as Template[];

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Empty / sentinel ids → bounce to dashboard (keeps /playground/undefined a 307).
  if (!id || id === "undefined" || id === "null") {
    redirect("/dashboard");
  }

  const template = templates.find((t) => t.slug === id);

  // Unknown slug (e.g. /playground/test) → friendly 200, no 500.
  if (!template) {
    return <TemplateNotFound />;
  }

  return <WebPlayground name={template.name} />;
}


import { redirect } from 'next/navigation';

// Server wrapper: validates id before any client component renders
export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || id === 'undefined' || id === 'null' || id === '') {
    redirect('/dashboard');
  }

  // Dynamically import client component to avoid SSR issues with WebContainers
  const { PlaygroundContent } = await import('./playground-content');
  return <PlaygroundContent id={id} />;
}

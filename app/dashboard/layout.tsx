import React from "react";

// Pass-through: /dashboard redirects to /playgrounds, so no sidebar/data fetch.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { ComponentProps } from "react";

// The page's one action. Defaults to type="button" so it never submits by accident.
export function Button({ type = "button", ...props }: ComponentProps<"button">) {
  return <button {...props} type={type} className="button" />;
}

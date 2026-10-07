import { PageShell } from "@/components/page-shell";
import SignInForm from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <PageShell>
      <h1>Sign in</h1>
      <SignInForm />
    </PageShell>
  );
}

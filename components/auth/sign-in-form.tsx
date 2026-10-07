import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { signIn } from "@/auth";

async function handleGoogleSignIn() {
  "use server";
  await signIn("google");
}

async function handleGithubSignIn() {
  "use server";
  await signIn("github");
}

const SignInForm = () => {
  return (
    <Panel>
      <p>Sign in with a GitHub or Google account. The playgrounds need no account.</p>
      <div className="row">
        <form action={handleGithubSignIn}>
          <Button type="submit">Sign in with GitHub</Button>
        </form>
        <form action={handleGoogleSignIn}>
          <Button type="submit">Sign in with Google</Button>
        </form>
      </div>
    </Panel>
  );
};

export default SignInForm;

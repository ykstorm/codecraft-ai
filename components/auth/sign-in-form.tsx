import React from "react";
import { Chrome, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Choose your preferred sign-in method
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <form action={handleGoogleSignIn}>
          <Button type="submit" variant={"outline"} className="w-full">
            <Chrome className="mr-2 h-4 w-4" />
            <span>Sign in with google</span>
          </Button>
        </form>
        <form action={handleGithubSignIn}>
          <Button type="submit" variant={"outline"} className="w-full">
            <Github className="mr-2 h-4 w-4" />
            <span>Sign in with github</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignInForm;

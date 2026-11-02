import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <Suspense>
      <main className="auth-wrapper">
        <SignIn />
      </main>
    </Suspense>
  );
}

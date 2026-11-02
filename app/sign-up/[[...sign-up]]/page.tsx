import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <Suspense>
      <main className="auth-wrapper">
        <SignUp />
      </main>
    </Suspense>
  );
}

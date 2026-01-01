import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div>
      <SignIn signUpForceRedirectUrl={"/auth/callback"} />
    </div>
  );
}

import { redirect } from "next/navigation";

// The app is auth-gated; send everyone to the dashboard, where middleware and
// the session guard will bounce unauthenticated visitors to /login.
export default function Home() {
  redirect("/dashboard");
}

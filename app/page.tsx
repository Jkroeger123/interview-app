import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to visa selection to start the flow
  redirect("/select-visa");
}

import { redirect } from "next/navigation";

export default function BulkingRedirectPage() {
  redirect("/goals/bulk");
}

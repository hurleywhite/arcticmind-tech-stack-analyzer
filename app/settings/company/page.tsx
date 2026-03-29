import { redirect } from "next/navigation";

export default function CompanySettingsRedirect() {
  redirect("/dashboard/settings/company");
}

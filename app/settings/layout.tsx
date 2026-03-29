import { redirect } from "next/navigation";

export default function SettingsRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/dashboard/settings");
  return <>{children}</>;
}

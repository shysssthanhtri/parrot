import { redirect } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";

export default function SettingsPage() {
  redirect(ROUTES.CMS.SETTINGS_PERSONAL);
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CMSPageHeader } from "../../_components/cms-page-header";
import { SignOutButton } from "../_components/sign-out-button";
import { ThemeSettings } from "../_components/theme-settings";

export default function PersonalSettingsPage() {
  return (
    <>
      <CMSPageHeader
        breadcrumbs={[{ label: "Settings" }, { label: "Personal" }]}
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex max-w-xl flex-col gap-4">
          <ThemeSettings />
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Sign out of your Parrot account on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignOutButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CmsSettingsPlaceholder } from "./cms-settings-placeholder";
import { SignOutButton } from "./sign-out-button";
import { ThemeSettings } from "./theme-settings";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="personal">
      <TabsList>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="cms">CMS</TabsTrigger>
      </TabsList>
      <TabsContent value="personal" className="mt-4">
        <div className="flex flex-col gap-4">
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
      </TabsContent>
      <TabsContent value="cms" className="mt-4">
        <CmsSettingsPlaceholder />
      </TabsContent>
    </Tabs>
  );
}

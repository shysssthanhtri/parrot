import { ThemeSettings } from "./_components/theme-settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Parrot preferences.
        </p>
      </div>
      <div className="max-w-xl">
        <ThemeSettings />
      </div>
    </div>
  );
}

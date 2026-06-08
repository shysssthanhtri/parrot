"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose how Parrot looks on this device. System follows your OS
          preference.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          variant="outline"
          value={theme ?? "system"}
          onValueChange={(value) => value && setTheme(value)}
        >
          <ToggleGroupItem value="light" aria-label="Light mode">
            <Sun />
            Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark mode">
            <Moon />
            Dark
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="System theme">
            <Monitor />
            System
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}

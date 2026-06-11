"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const emptySubscribe = () => () => {};

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

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
        {!mounted ? (
          <Skeleton className="h-9 w-full max-w-sm" />
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}

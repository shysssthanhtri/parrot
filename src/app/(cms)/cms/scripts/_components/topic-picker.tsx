"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type TopicOption = {
  id: string;
  name: string;
  color: string;
};

type TopicPickerProps = {
  topics: TopicOption[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
};

export function TopicPicker({
  topics,
  selectedIds,
  onSelectedChange,
}: TopicPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedTopics = useMemo(
    () => topics.filter((t) => selectedIds.includes(t.id)),
    [topics, selectedIds]
  );

  function handleToggle(topicId: string) {
    if (selectedIds.includes(topicId)) {
      onSelectedChange(selectedIds.filter((id) => id !== topicId));
    } else {
      onSelectedChange([...selectedIds, topicId]);
    }
  }

  function handleRemove(topicId: string) {
    onSelectedChange(selectedIds.filter((id) => id !== topicId));
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start font-normal"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} topic${selectedIds.length > 1 ? "s" : ""} selected`
              : "Select topics…"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search topics…" />
            <CommandList>
              <CommandEmpty>No topics found.</CommandEmpty>
              <CommandGroup>
                {topics.map((topic) => {
                  const isSelected = selectedIds.includes(topic.id);
                  return (
                    <CommandItem
                      key={topic.id}
                      value={topic.name}
                      onSelect={() => handleToggle(topic.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: topic.color }}
                        />
                        <span className="flex-1">{topic.name}</span>
                        {isSelected && (
                          <span className="text-xs text-muted-foreground">
                            ✓
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTopics.map((topic) => (
            <Badge
              key={topic.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={{
                borderColor: topic.color,
                borderWidth: "1px",
              }}
            >
              <div
                className="size-2 rounded-full"
                style={{ backgroundColor: topic.color }}
              />
              {topic.name}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                onClick={() => handleRemove(topic.id)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

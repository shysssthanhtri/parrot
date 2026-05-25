"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const TestPage = () => {
  return <Button onClick={() => toast.success("Hello")}>Click me</Button>;
};

export default TestPage;

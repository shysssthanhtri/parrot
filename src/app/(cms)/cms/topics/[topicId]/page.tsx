import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { TopicForm, TopicFormBackLink } from "../_components/topic-form";
import { TopicDeleteButton } from "./_components/topic-delete-button";

const createCaller = createCallerFactory(appRouter);

type TopicDetailPageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { topicId } = await params;
  const caller = createCaller(await createTRPCContext());

  let topic;
  try {
    topic = await caller.topics.getById({ id: topicId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <TopicFormBackLink />
      <TopicForm
        mode="edit"
        topicId={topic.id}
        defaultValues={{
          name: topic.name,
          description: topic.description ?? "",
          color: topic.color,
        }}
      />
      <TopicDeleteButton topicId={topic.id} topicName={topic.name} />
    </div>
  );
}

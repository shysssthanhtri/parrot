import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../../_components/cms-page-header";

const createCaller = createCallerFactory(appRouter);

type TopicDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ topicId: string }>;
};

export default async function TopicDetailLayout({
  children,
  params,
}: TopicDetailLayoutProps) {
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
    <>
      <CMSPageHeader
        breadcrumbs={[
          { label: "Topics", href: ROUTES.CMS.TOPICS },
          { label: topic.name },
        ]}
      />
      {children}
    </>
  );
}

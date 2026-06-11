import { ROUTES } from "@/app/configs/routes";

import { CMSPageHeader } from "../../_components/cms-page-header";
import { TopicForm } from "../_components/topic-form";

export default function NewTopicPage() {
  return (
    <>
      <CMSPageHeader
        breadcrumbs={[
          { label: "Topics", href: ROUTES.CMS.TOPICS },
          { label: "New" },
        ]}
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <TopicForm mode="create" />
      </div>
    </>
  );
}

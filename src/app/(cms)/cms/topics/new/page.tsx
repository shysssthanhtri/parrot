import { TopicForm, TopicFormBackLink } from "../_components/topic-form";

export default function NewTopicPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <TopicFormBackLink />
      <TopicForm mode="create" />
    </div>
  );
}

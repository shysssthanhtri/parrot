import { ROUTES } from "@/app/configs/routes";

import { CMSPageHeader } from "../../_components/cms-page-header";
import { SpeechCreateForm } from "../_components/speech-create-form";

export default function NewSpeechPage() {
  return (
    <>
      <CMSPageHeader
        breadcrumbs={[
          { label: "Speeches", href: ROUTES.CMS.SPEECHES },
          { label: "New" },
        ]}
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <SpeechCreateForm />
      </div>
    </>
  );
}

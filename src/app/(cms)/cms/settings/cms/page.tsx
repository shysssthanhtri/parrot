import { CMSPageHeader } from "../../_components/cms-page-header";
import { CmsSettingsPlaceholder } from "../_components/cms-settings-placeholder";

export default function CmsSettingsPage() {
  return (
    <>
      <CMSPageHeader breadcrumbs={[{ label: "Settings" }, { label: "CMS" }]} />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="max-w-xl">
          <CmsSettingsPlaceholder />
        </div>
      </div>
    </>
  );
}

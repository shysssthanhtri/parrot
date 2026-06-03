import {
  ScriptForm,
  ScriptFormBackLink,
} from "../_components/script-form";

export default function NewScriptPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <ScriptFormBackLink />
      <ScriptForm mode="create" />
    </div>
  );
}

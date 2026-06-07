import {
  SpeechCreateForm,
  SpeechCreateFormBackLink,
} from "../_components/speech-create-form";

export default function NewSpeechPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <SpeechCreateFormBackLink />
      <SpeechCreateForm />
    </div>
  );
}

import { SpeechDetailClient } from "./_components/speech-detail-client";

type SpeechDetailPageProps = {
  params: Promise<{ speechId: string }>;
};

export default async function SpeechDetailPage({
  params,
}: SpeechDetailPageProps) {
  const { speechId } = await params;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <SpeechDetailClient speechId={speechId} />
    </div>
  );
}

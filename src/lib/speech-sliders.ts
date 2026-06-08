import type { components } from "@/lib/chatterbox/schema";

type ChatterboxTtsParams = Pick<
  components["schemas"]["TTSRequest"],
  "temperature" | "top_p" | "top_k" | "repetition_penalty" | "norm_loudness"
>;

export type SpeechSliderId =
  | "temperature"
  | "topP"
  | "topK"
  | "repetitionPenalty";

export type SpeechSliderDefinition = {
  id: SpeechSliderId;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  description: string;
};

export const SPEECH_SLIDERS = [
  {
    id: "temperature",
    label: "Creativity",
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.8,
    description:
      "How much the delivery varies between runs; lower is steadier, higher is more expressive",
  },
  {
    id: "topP",
    label: "Voice Variety",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.95,
    description:
      "How wide the model's word choices are; lower stays closer to the most likely phrasing",
  },
  {
    id: "topK",
    label: "Expression Range",
    min: 1,
    max: 10000,
    step: 100,
    default: 1000,
    description:
      "How many candidate words are considered; lower is subtler, higher allows bolder delivery",
  },
  {
    id: "repetitionPenalty",
    label: "Natural Flow",
    min: 1,
    max: 2,
    step: 0.1,
    default: 1.2,
    description:
      "How strongly repeated phrasing is avoided; lower can sound more rhythmic, higher more varied",
  },
] as const satisfies readonly SpeechSliderDefinition[];

export const DEFAULT_NORM_LOUDNESS = true;

export const NORM_LOUDNESS_CONTROL = {
  label: "Normalize loudness",
  default: DEFAULT_NORM_LOUDNESS,
  description:
    "Normalizes output volume for consistent playback across different voice and script combinations",
} as const;

export type SpeechTtsParams = {
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  normLoudness: boolean;
};

export const DEFAULT_SPEECH_TTS_PARAMS: SpeechTtsParams = {
  temperature: 0.5,
  topP: 0.9,
  topK: 1000,
  repetitionPenalty: 1.0,
  normLoudness: DEFAULT_NORM_LOUDNESS,
};

export function toChatterboxTtsParams(
  params: SpeechTtsParams
): ChatterboxTtsParams {
  return {
    temperature: params.temperature,
    top_p: params.topP,
    top_k: params.topK,
    repetition_penalty: params.repetitionPenalty,
    norm_loudness: params.normLoudness,
  };
}

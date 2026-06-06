export const SCRIPT_LANGUAGES = [
  { value: "en-US", label: "English" },
  { value: "vi-VN", label: "Vietnamese" },
  { value: "zh-CN", label: "Chinese" },
  { value: "ko-KR", label: "Korean" },
  { value: "ja-JP", label: "Japanese" },
] as const;

export type ScriptLanguageCode = (typeof SCRIPT_LANGUAGES)[number]["value"];

export const SCRIPT_LANGUAGE_CODES = SCRIPT_LANGUAGES.map(
  (language) => language.value
) as [ScriptLanguageCode, ...ScriptLanguageCode[]];

export const DEFAULT_SCRIPT_LANGUAGE: ScriptLanguageCode = "en-US";

const labelByCode = new Map<string, string>(
  SCRIPT_LANGUAGES.map((language) => [language.value, language.label])
);

export function getScriptLanguageLabel(code: string): string {
  return labelByCode.get(code) ?? code;
}

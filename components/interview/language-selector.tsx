"use client";

import { useInterview } from "@/lib/contexts/interview-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

// Supported languages with Cartesia Sonic-3 TTS + Ink Whisper STT
const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
];

export function LanguageSelector() {
  const { configuration, setInterviewLanguage } = useInterview();

  return (
    <div className="space-y-3">
      <Label
        htmlFor="language"
        className="text-base font-semibold flex items-center gap-2"
      >
        <Globe className="size-4" />
        Interview Language
      </Label>
      <Select
        value={configuration.interviewLanguage}
        onValueChange={setInterviewLanguage}
      >
        <SelectTrigger id="language" className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-muted-foreground text-sm">
                  ({lang.name})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        The AI interviewer will conduct the interview in your selected language
      </p>
    </div>
  );
}

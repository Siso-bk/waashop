"use client";

import { useState } from "react";

type Props = {
  winUrl: string;
  loseUrl: string;
};

export function JackpotSoundFields({ winUrl, loseUrl }: Props) {
  const [winSoundUrl, setWinSoundUrl] = useState(winUrl);
  const [loseSoundUrl, setLoseSoundUrl] = useState(loseUrl);

  const handleUpload = (
    file: File | null,
    setValue: (value: string) => void,
    label: string
  ) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert(`${label} must be under 2MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setValue(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="block text-sm text-slate-600">
          Jackpot win sound URL
          <input
            name="jackpotWinSoundUrl"
            type="text"
            value={winSoundUrl}
            onChange={(event) => setWinSoundUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Upload
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0] || null, setWinSoundUrl, "Win sound")}
          />
        </label>
        {winSoundUrl && (
          <button
            type="button"
            onClick={() => setWinSoundUrl("")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear win sound
          </button>
        )}
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-slate-600">
          Jackpot lose sound URL
          <input
            name="jackpotLoseSoundUrl"
            type="text"
            value={loseSoundUrl}
            onChange={(event) => setLoseSoundUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Upload
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0] || null, setLoseSoundUrl, "Lose sound")}
          />
        </label>
        {loseSoundUrl && (
          <button
            type="button"
            onClick={() => setLoseSoundUrl("")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear lose sound
          </button>
        )}
      </div>
    </div>
  );
}

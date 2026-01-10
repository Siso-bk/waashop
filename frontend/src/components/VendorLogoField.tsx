"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { uploadFileToGcs } from "@/lib/uploads";

const MAX_LOGO_BYTES = 250 * 1024;

type Props = {
  initialValue?: string;
};

export function VendorLogoField({ initialValue = "" }: Props) {
  const [logoValue, setLogoValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isDataLogo = useMemo(() => logoValue.startsWith("data:image/"), [logoValue]);
  const displayUrl = isDataLogo ? "" : logoValue;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError("Logo must be under 250KB.");
      event.target.value = "";
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      const url = await uploadFileToGcs(file, { folder: "vendor-logos" });
      setLogoValue(url);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload logo.";
      setError(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogoValue(event.target.value);
    setError(null);
  };

  const clearLogo = () => {
    setLogoValue("");
    setError(null);
  };

  return (
    <div className="space-y-2 text-sm text-gray-600">
      <input type="hidden" name="logoUrl" value={logoValue} />
      <span>Brand logo (optional)</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {isUploading ? "Uploading..." : "Upload logo"}
        </label>
        {logoValue && (
          <button
            type="button"
            onClick={clearLogo}
            className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600"
          >
            Clear
          </button>
        )}
        {logoValue && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-black/10 bg-white">
              <Image src={logoValue} alt="Logo preview" fill sizes="48px" className="object-cover" unoptimized />
            </div>
            <span>{isUploading ? "Uploading..." : isDataLogo ? "Uploaded from device" : "Logo URL added"}</span>
          </div>
        )}
      </div>
      <input
        name="logoUrlInput"
        type="url"
        value={displayUrl}
        onChange={handleUrlChange}
        className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
        placeholder="Paste logo URL instead"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

"use client";

import { useState, type ChangeEvent } from "react";
import { PendingButton } from "@/components/PendingButton";
import { uploadFileToGcs } from "@/lib/uploads";

type WinnerFormClientProps = {
  action: (formData: FormData) => void;
};

const MAX_IMAGE_BYTES = 2_000_000;

export function WinnerFormClient({ action }: WinnerFormClientProps) {
  const [winnerType, setWinnerType] = useState<"CHALLENGE" | "MYSTERY_BOX">("CHALLENGE");
  const [winnerName, setWinnerName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const effectiveImageUrl = uploadedImageUrl || imageUrl;
  const previewName = winnerName.trim() || "Winner name";
  const previewHeadline = headline.trim() || "Spotlight headline";
  const previewDescription = description.trim() || "Add a short description for the spotlight.";

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 2MB.");
      event.target.value = "";
      return;
    }
    try {
      setIsUploading(true);
      setImageError("");
      const url = await uploadFileToGcs(file, "winners");
      setUploadedImageUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload image.";
      setImageError(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="text-sm text-slate-600">
        Winner type
        <select
          name="winnerType"
          value={winnerType}
          onChange={(event) => setWinnerType(event.target.value as "CHALLENGE" | "MYSTERY_BOX")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="CHALLENGE">Challenge</option>
          <option value="MYSTERY_BOX">Mystery box</option>
        </select>
      </label>
      <label className="text-sm text-slate-600">
        Winner name
        <input
          name="winnerName"
          required
          value={winnerName}
          onChange={(event) => setWinnerName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-slate-600">
        Headline
        <input
          name="headline"
          required
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-slate-600">
        Description
        <textarea
          name="description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-slate-600">
        Image URL (optional)
        <input
          name="imageUrlInput"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-slate-600">
        Upload image (optional)
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-2 w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
        <span className="mt-2 block text-xs text-slate-400">
          {isUploading ? "Uploading..." : "JPG, PNG, or WEBP up to 2MB."}
        </span>
        {imageError && <span className="mt-2 block text-xs text-red-500">{imageError}</span>}
      </label>
      <input type="hidden" name="imageUrl" value={effectiveImageUrl} />
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            Preview
            {uploadedImageUrl && (
              <button
                type="button"
                onClick={() => setUploadedImageUrl("")}
                className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-500"
              >
                Use URL instead
              </button>
            )}
          </div>
          <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {effectiveImageUrl && (
              <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img src={effectiveImageUrl} alt={previewHeadline} className="h-32 w-full object-cover" />
              </div>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{previewName}</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{previewHeadline}</h3>
            <p className="text-sm text-slate-500">{previewDescription}</p>
          </article>
        </div>
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Spotlights go live as soon as they are published.</p>
        <PendingButton pendingLabel="Publishing..." className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
          Publish winner
        </PendingButton>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { PendingButton } from "@/components/PendingButton";
import { uploadFileToGcs } from "@/lib/uploads";

type PromoImageFormClientProps = {
  action: (formData: FormData) => void;
  card: {
    id: string;
    title: string;
    imageUrl?: string;
  };
};

export function PromoImageFormClient({ action, card }: PromoImageFormClientProps) {
  const { pending } = useFormStatus();
  const [imageUrl, setImageUrl] = useState(card.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const handleClear = useCallback(() => {
    if (window.confirm("Clear this promo image?")) {
      setImageUrl("");
    }
  }, []);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="cardId" value={card.id} />
      <input
        name="imageUrl"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
        placeholder="Image URL (optional)"
      />
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.2em]">
          {isUploading ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024) {
                window.alert("Please use an image under 1MB.");
                return;
              }
              try {
                setIsUploading(true);
                setUploadError("");
                const url = await uploadFileToGcs(file, "promo-cards");
                setImageUrl(url);
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to upload image.";
                setUploadError(message);
              } finally {
                setIsUploading(false);
                event.target.value = "";
              }
            }}
          />
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.2em]"
          >
            Clear
          </button>
        )}
        {uploadError ? (
          <span className="text-red-500">{uploadError}</span>
        ) : (
          <span>Uploads store in your Waashop bucket.</span>
        )}
      </div>
      {imageUrl && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={card.title} className="h-24 w-full object-cover" />
        </div>
      )}
      <PendingButton pendingLabel="Saving..." disabled={pending} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
        Save image
      </PendingButton>
    </form>
  );
}

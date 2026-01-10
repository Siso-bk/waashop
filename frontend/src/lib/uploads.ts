type SignedUploadResponse = {
  publicUrl: string;
  viewUrl?: string;
  objectName: string;
};

type UploadOptions = {
  folder?: string;
  access?: "public" | "signed";
};

export const uploadFileToGcs = async (file: File, options?: UploadOptions): Promise<string> => {
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("File must be 5MB or smaller.");
  }
  const formData = new FormData();
  formData.append("file", file);
  if (options?.folder) {
    formData.append("folder", options.folder);
  }
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as Partial<SignedUploadResponse> & {
    error?: string;
  };

  if (!response.ok || !data.publicUrl) {
    throw new Error(data.error || "Unable to prepare upload.");
  }

  if (options?.access === "signed" && data.viewUrl) {
    return data.viewUrl;
  }
  return data.publicUrl;
};

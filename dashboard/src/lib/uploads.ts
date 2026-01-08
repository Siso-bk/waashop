type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectName: string;
};

export const uploadFileToGcs = async (file: File, folder?: string): Promise<string> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const endpoint = baseUrl ? `${baseUrl}/api/uploads/sign` : "/api/uploads/sign";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<SignedUploadResponse> & {
    error?: string;
  };

  if (!response.ok || !data.uploadUrl || !data.publicUrl) {
    throw new Error(data.error || "Unable to prepare upload.");
  }

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload failed.");
  }

  return data.publicUrl;
};

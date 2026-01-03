"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { formatMinis } from "@/lib/minis";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

type TransferDto = {
  id: string;
  senderId: string;
  recipientId: string;
  recipientHandle: string;
  amountMinis: number;
  feeMinis: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  note?: string;
  adminNote?: string;
  createdAt: string;
};

type ActionType = "send" | "receive" | "deposit" | "withdraw" | null;

type WalletActionModalProps = {
  balanceMinis: number;
  userHandle: string;
  outgoingTransfers: TransferDto[];
  incomingTransfers: TransferDto[];
  initialRecipient?: string;
  initialAmount?: string;
  initialAction?: ActionType;
  createDeposit: (prevState: FormState, formData: FormData) => Promise<FormState>;
  createWithdrawal: (prevState: FormState, formData: FormData) => Promise<FormState>;
  createTransfer: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialFormState: FormState = { status: "idle" };

const actionLabels: Record<Exclude<ActionType, null>, { title: string; subtitle: string }> = {
  send: {
    title: "Send MINIS",
    subtitle: "Transfer to another user. Use their email or username@pai.",
  },
  receive: {
    title: "Receive MINIS",
    subtitle: "Share your handle to receive transfers.",
  },
  deposit: {
    title: "Deposit MINIS",
    subtitle: "Submit your payment proof and we’ll credit your wallet.",
  },
  withdraw: {
    title: "Withdraw MINIS",
    subtitle: "Request a payout and track approval status here.",
  },
};

export function WalletActionModal({
  balanceMinis,
  userHandle,
  outgoingTransfers,
  incomingTransfers,
  initialRecipient,
  initialAmount,
  initialAction,
  createDeposit,
  createWithdrawal,
  createTransfer,
}: WalletActionModalProps) {
  const router = useRouter();
  const [active, setActive] = useState<ActionType>(null);
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showIncoming, setShowIncoming] = useState(false);
  const [depositState, depositAction] = useFormState(createDeposit, initialFormState);
  const [withdrawState, withdrawAction] = useFormState(createWithdrawal, initialFormState);
  const [transferState, transferAction] = useFormState(createTransfer, initialFormState);
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [recipientValue, setRecipientValue] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [transferLink, setTransferLink] = useState<string | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const scannerRef = useRef<any>(null);
  const fileScannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraReaderId = "waashop-qr-camera-reader";
  const fileReaderId = "waashop-qr-file-reader";

  const qrPayload = useMemo(() => {
    if (!userHandle) return "";
    const params = new URLSearchParams({ to: userHandle });
    const amount = Number(receiveAmount);
    if (Number.isFinite(amount) && amount > 0) {
      params.set("amount", String(amount));
    }
    if (transferLink) {
      const url = new URL(transferLink);
      params.forEach((value, key) => url.searchParams.set(key, value));
      return url.toString();
    }
    return `waashop://transfer?${params.toString()}`;
  }, [userHandle, transferLink, receiveAmount]);

  const qrFilename = useMemo(() => {
    const base = userHandle ? userHandle.replace(/[^a-z0-9._-]+/gi, "_") : "waashop-handle";
    return `${base}-qr.png`;
  }, [userHandle]);
  const actionList = useMemo(
    () => [
      { key: "send", label: "Send" },
      { key: "receive", label: "Receive" },
      { key: "deposit", label: "Deposit" },
      { key: "withdraw", label: "Withdraw" },
    ],
    []
  );

  useEffect(() => {
    if (!userHandle) return;
    const base =
      (appUrl && appUrl.replace(/\/+$/, "")) ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!base) return;
    setTransferLink(`${base}/transfer?to=${encodeURIComponent(userHandle)}`);
  }, [appUrl, userHandle]);

  useEffect(() => {
    if (!initialAction) return;
    setActive(initialAction);
  }, [initialAction]);

  useEffect(() => {
    if (initialRecipient) setRecipientValue(initialRecipient);
    if (initialAmount) setAmountValue(initialAmount);
  }, [initialRecipient, initialAmount]);

  useEffect(() => {
    if (active !== "send") {
      setRecipientValue("");
      setAmountValue("");
      setScannerOpen(false);
      setScanStatus("idle");
      setScanMessage(null);
      setIsTransferSubmitting(false);
    }
    if (active !== "deposit") setIsDepositSubmitting(false);
    if (active !== "withdraw") setIsWithdrawSubmitting(false);
  }, [active]);

  useEffect(() => {
    if (active !== "receive") {
      setQrDataUrl(null);
      setQrStatus("idle");
      setCopyStatus(null);
      return;
    }
    if (!qrPayload) return;
    let cancelled = false;
    setQrStatus("loading");
    QRCode.toDataURL(qrPayload, {
      margin: 1,
      scale: 6,
      color: { dark: "#0b0b0b", light: "#ffffff" },
    })
      .then((url) => {
        if (cancelled) return;
        setQrDataUrl(url);
        setQrStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setQrStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [active, qrPayload]);

  useEffect(() => {
    if (active) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return undefined;
  }, [active]);

  useEffect(() => {
    if (active === "deposit" && depositState.status === "success") {
      router.refresh();
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    if (depositState.status !== "idle") {
      setIsDepositSubmitting(false);
    }
    return undefined;
  }, [active, depositState.status]);

  useEffect(() => {
    if (active === "withdraw" && withdrawState.status === "success") {
      router.refresh();
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    if (withdrawState.status !== "idle") {
      setIsWithdrawSubmitting(false);
    }
    return undefined;
  }, [active, withdrawState.status]);

  useEffect(() => {
    if (active === "send" && transferState.status === "success") {
      router.refresh();
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    if (transferState.status !== "idle") {
      setIsTransferSubmitting(false);
    }
    return undefined;
  }, [active, transferState.status]);

  useEffect(() => {
    if (!scannerOpen || active !== "send") {
      stopScanner();
      return undefined;
    }
    let cancelled = false;
    setScanStatus("starting");
    setScanMessage(null);
    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const Html5Qrcode = (mod as any).Html5Qrcode;
        const cameras = await (Html5Qrcode as any).getCameras();
        const preferred = cameras?.find((cam: any) => /back|rear|environment/i.test(cam.label)) || cameras?.[0];
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(cameraReaderId);
        }
        await scannerRef.current.start(
          preferred?.id ? { deviceId: { exact: preferred.id } } : { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText: string) => {
            handleScanResult(decodedText);
            setScannerOpen(false);
          },
          () => undefined
        );
        if (!cancelled) {
          setScanStatus("scanning");
        }
      } catch (error) {
        if (cancelled) return;
        setScanStatus("error");
        setScanMessage("Camera scan failed or permission denied. Try upload or enter manually.");
        setScannerOpen(false);
      }
    })();
    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [scannerOpen, active]);

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }
    } catch {
      // Best-effort cleanup.
    }
  }

  function parseTransferPayload(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const normalized =
      trimmed.startsWith("waashop:") && !trimmed.startsWith("waashop://")
        ? trimmed.replace("waashop:", "waashop://")
        : trimmed;
    if (normalized.startsWith("waashop://") || normalized.startsWith("http://") || normalized.startsWith("https://")) {
      try {
        const url = new URL(normalized);
        const recipient = url.searchParams.get("to") || url.searchParams.get("handle") || "";
        const amountRaw = url.searchParams.get("amount") || url.searchParams.get("amountMinis") || "";
        const amountMinis = amountRaw ? Number(amountRaw) : undefined;
        return { recipient, amountMinis };
      } catch {
        return null;
      }
    }
    return { recipient: trimmed };
  }

  function handleScanResult(value: string) {
    const parsed = parseTransferPayload(value);
    if (!parsed || !parsed.recipient) {
      setScanMessage("QR found but no recipient detected. Paste manually.");
      return;
    }
    setRecipientValue(parsed.recipient);
    if (parsed.amountMinis && Number.isFinite(parsed.amountMinis)) {
      setAmountValue(String(parsed.amountMinis));
    }
    setScanMessage("Recipient filled from QR.");
  }

  async function handleFileScan(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanStatus("starting");
    setScanMessage("Scanning image…");
    try {
      const mod = await import("html5-qrcode");
      const Html5Qrcode = (mod as any).Html5Qrcode;
      if (!fileScannerRef.current) {
        fileScannerRef.current = new Html5Qrcode(fileReaderId);
      }
      const decoded = await fileScannerRef.current.scanFile(file, true);
      handleScanResult(decoded);
      setScanStatus("idle");
    } catch {
      setScanStatus("error");
      setScanMessage("No QR code found in that image.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleCopy(text: string, label: string) {
    if (!navigator?.clipboard) {
      setCopyStatus("Copy not supported in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
      setTimeout(() => setCopyStatus(null), 1600);
    } catch {
      setCopyStatus("Unable to copy.");
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {actionList.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setActive(action.key as ActionType)}
              className={`flex min-w-[98px] items-center justify-center rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] transition ${
                action.key === "deposit"
                  ? "bg-black text-white hover:bg-gray-900"
                  : "border border-black/15 text-black hover:bg-black hover:text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{actionLabels[active].title}</p>
                <h2 className="mt-2 text-lg font-semibold text-black">{actionLabels[active].subtitle}</h2>
                <p className="mt-1 text-xs text-gray-500">Balance: {formatMinis(balanceMinis)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 pt-6">
            {active === "deposit" && (
              <form
                action={depositAction}
                className="space-y-4 text-sm text-gray-700"
                onSubmit={() => setIsDepositSubmitting(true)}
              >
                <input
                  name="amountMinis"
                  type="number"
                  min={1}
                  step={1}
                  required
                  placeholder="Amount (MINIS)"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="currency"
                  placeholder="Currency (USD, ETB, USDT...)"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="paymentMethod"
                  required
                  placeholder="Payment method"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="paymentReference"
                  placeholder="Transaction reference"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="proofUrl"
                  placeholder="Proof link (optional)"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Notes to admin"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={isDepositSubmitting || depositState.status === "success"}
                  className={`w-full rounded-full px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isDepositSubmitting
                      ? "bg-black/80"
                      : depositState.status === "success"
                      ? "bg-emerald-600"
                      : depositState.status === "error"
                      ? "bg-red-600"
                      : "bg-black hover:bg-gray-900"
                  }`}
                >
                  {isDepositSubmitting
                    ? "Submitting…"
                    : depositState.status === "success"
                    ? "Success ✓"
                    : depositState.status === "error"
                    ? "Failed ✕"
                    : "Submit deposit"}
                </button>
                {depositState.status !== "idle" && (
                  <p
                    className={`text-xs ${
                      depositState.status === "success" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {depositState.status === "success" ? "✓ " : "✕ "}
                    {depositState.message}
                  </p>
                )}
              </form>
            )}

            {active === "withdraw" && (
              <form
                action={withdrawAction}
                className="space-y-4 text-sm text-gray-700"
                onSubmit={() => setIsWithdrawSubmitting(true)}
              >
                <input
                  name="amountMinis"
                  type="number"
                  min={1}
                  step={1}
                  required
                  placeholder="Amount (MINIS)"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="payoutMethod"
                  required
                  placeholder="Payout method"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="payoutAddress"
                  placeholder="Account / wallet address"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input
                  name="accountName"
                  placeholder="Account name"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Notes to admin"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={isWithdrawSubmitting || withdrawState.status === "success"}
                  className={`w-full rounded-full px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isWithdrawSubmitting
                      ? "bg-black/80"
                      : withdrawState.status === "success"
                      ? "bg-emerald-600"
                      : withdrawState.status === "error"
                      ? "bg-red-600"
                      : "bg-black hover:bg-gray-900"
                  }`}
                >
                  {isWithdrawSubmitting
                    ? "Submitting…"
                    : withdrawState.status === "success"
                    ? "Success ✓"
                    : withdrawState.status === "error"
                    ? "Failed ✕"
                    : "Submit withdrawal"}
                </button>
                {withdrawState.status !== "idle" && (
                  <p
                    className={`text-xs ${
                      withdrawState.status === "success" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {withdrawState.status === "success" ? "✓ " : "✕ "}
                    {withdrawState.message}
                  </p>
                )}
              </form>
            )}

            {active === "send" && (
              <div className="space-y-6">
                <form
                  action={transferAction}
                  className="space-y-4 text-sm text-gray-700"
                  onSubmit={() => setIsTransferSubmitting(true)}
                >
                  <input
                    name="recipient"
                    required
                    placeholder="Recipient email or username@pai"
                    value={recipientValue}
                    onChange={(event) => setRecipientValue(event.target.value)}
                    className="w-full rounded-xl border border-black/10 px-3 py-2"
                  />
                  <input
                    name="amountMinis"
                    type="number"
                    min={1}
                    step={1}
                    required
                    placeholder="Amount (MINIS)"
                    value={amountValue}
                    onChange={(event) => setAmountValue(event.target.value)}
                    className="w-full rounded-xl border border-black/10 px-3 py-2"
                  />
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Note (optional)"
                    className="w-full rounded-xl border border-black/10 px-3 py-2"
                  />
                  <button
                    type="submit"
                    disabled={isTransferSubmitting || transferState.status === "success"}
                    className={`w-full rounded-full px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      isTransferSubmitting
                        ? "bg-black/80"
                        : transferState.status === "success"
                        ? "bg-emerald-600"
                        : transferState.status === "error"
                        ? "bg-red-600"
                        : "bg-black hover:bg-gray-900"
                    }`}
                  >
                    {isTransferSubmitting
                      ? "Sending…"
                      : transferState.status === "success"
                      ? "Success ✓"
                      : transferState.status === "error"
                      ? "Failed ✕"
                      : "Send transfer"}
                  </button>
                  {transferState.status !== "idle" && (
                    <p
                      className={`text-xs ${
                        transferState.status === "success" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {transferState.status === "success" ? "✓ " : "✕ "}
                      {transferState.message}
                    </p>
                  )}
                </form>
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Scan QR</p>
                      <p className="mt-1 text-xs text-gray-500">Use camera or upload a QR image.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScannerOpen((prev) => !prev)}
                        className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                      >
                        {scannerOpen ? "Stop" : "Scan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    {scannerOpen && (
                      <div className="overflow-hidden rounded-2xl border border-black/10 bg-black">
                        <div id={cameraReaderId} className="h-48 w-full" />
                      </div>
                    )}
                    <div id={fileReaderId} className="hidden" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileScan}
                      className="hidden"
                    />
                    {!scannerOpen && scanStatus === "scanning" && <p className="text-xs text-gray-500">Scan stopped.</p>}
                    {scanMessage && <p className="mt-2 text-xs text-gray-500">{scanMessage}</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Recent sends</p>
                    <button
                      type="button"
                      onClick={() => setShowOutgoing((prev) => !prev)}
                      className="rounded-full border border-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      {showOutgoing ? "Fold" : "Expand"}
                    </button>
                  </div>
                  <div className={`overflow-y-auto ${showOutgoing ? "max-h-[320px]" : "max-h-[180px]"}`}>
                    <div className="space-y-2 px-3 py-3 text-xs text-gray-600">
                      {outgoingTransfers.slice(0, showOutgoing ? 12 : 0).map((transfer) => (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2"
                        >
                      <div>
                        <p className="text-gray-500">To {transfer.recipientHandle}</p>
                        <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                      </div>
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                        {transfer.status}
                      </span>
                    </div>
                      ))}
                      {showOutgoing && outgoingTransfers.length === 0 && <p>No outgoing transfers yet.</p>}
                      {!showOutgoing && outgoingTransfers.length > 0 && <p>Expand to view transfers.</p>}
                      {!showOutgoing && outgoingTransfers.length === 0 && <p>No outgoing transfers yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === "receive" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-dashed border-black/15 bg-gray-50 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Your handle</p>
                  <p className="mt-2 font-semibold text-black">{userHandle}</p>
                  <div className="mt-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Optional amount</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={receiveAmount}
                      onChange={(event) => setReceiveAmount(event.target.value)}
                      placeholder="Amount (MINIS)"
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(userHandle, "Handle")}
                      className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      Copy handle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(qrPayload, "Transfer link")}
                      className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      Copy link
                    </button>
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={qrFilename}
                        className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                      >
                        Download QR
                      </a>
                    )}
                  </div>
                  {copyStatus && <p className="mt-2 text-xs text-gray-500">{copyStatus}</p>}
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Receive via QR</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Let senders scan this code to auto-fill your handle.
                      </p>
                    </div>
                    <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                      Secure
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    {qrStatus === "loading" && <p className="text-xs text-gray-500">Generating QR…</p>}
                    {qrStatus === "error" && (
                      <p className="text-xs text-gray-500">Unable to generate QR. Try again.</p>
                    )}
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="Transfer QR"
                        className="h-48 w-48 rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
                      />
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Recent receives</p>
                    <button
                      type="button"
                      onClick={() => setShowIncoming((prev) => !prev)}
                      className="rounded-full border border-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      {showIncoming ? "Fold" : "Expand"}
                    </button>
                  </div>
                  <div className={`overflow-y-auto ${showIncoming ? "max-h-[320px]" : "max-h-[180px]"}`}>
                    <div className="space-y-2 px-3 py-3 text-xs text-gray-600">
                      {incomingTransfers.slice(0, showIncoming ? 12 : 0).map((transfer) => (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2"
                        >
                      <div>
                        <p className="text-gray-500">Incoming</p>
                        <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                      </div>
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                        {transfer.status}
                      </span>
                    </div>
                      ))}
                      {showIncoming && incomingTransfers.length === 0 && <p>No incoming transfers yet.</p>}
                      {!showIncoming && incomingTransfers.length > 0 && <p>Expand to view transfers.</p>}
                      {!showIncoming && incomingTransfers.length === 0 && <p>No incoming transfers yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

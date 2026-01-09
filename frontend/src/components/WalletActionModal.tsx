"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useActionState, type ChangeEvent } from "react";
import { formatMinis } from "@/lib/minis";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { uploadFileToGcs } from "@/lib/uploads";

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
  fxSettings: {
    minisPerUsd: number;
    usdToEtb: number;
  };
  depositMethodEntries: {
    key?: string;
    currency: "USD" | "ETB";
    method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
    label?: string;
    accountName?: string;
    accountNumber?: string;
    phoneNumber?: string;
    walletAddress?: string;
    instructions?: string;
  }[];
  payoutMethodEntries: {
    key?: string;
    currency: "USD" | "ETB";
    method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
    label?: string;
    instructions?: string;
  }[];
  payoutProcessingTimes: Record<string, string>;
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

type Html5QrCamera = {
  id: string;
  label: string;
};

type Html5QrcodeInstance = {
  isScanning?: boolean;
  start: (
    camera: { deviceId: { exact: string } } | { facingMode: "environment" },
    config: { fps: number; qrbox: number },
    onSuccess: (decodedText: string) => void,
    onFailure: (error: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
  scanFile: (file: File, showImage: boolean) => Promise<string>;
};

type Html5QrcodeModule = {
  Html5Qrcode: {
    new (elementId: string, configOrVerbosityFlag?: boolean | Record<string, unknown>): Html5QrcodeInstance;
    getCameras: () => Promise<Html5QrCamera[]>;
  };
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
  fxSettings,
  depositMethodEntries,
  payoutMethodEntries,
  payoutProcessingTimes,
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
  const [depositState, depositAction] = useActionState(createDeposit, initialFormState);
  const [withdrawState, withdrawAction] = useActionState(createWithdrawal, initialFormState);
  const [transferState, transferAction] = useActionState(createTransfer, initialFormState);
  const [transferFeedback, setTransferFeedback] = useState<FormState>(initialFormState);
  const [transferAttempt, setTransferAttempt] = useState(0);
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [recipientValue, setRecipientValue] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [minisValue, setMinisValue] = useState("");
  const [usdValue, setUsdValue] = useState("");
  const [etbValue, setEtbValue] = useState("");
  const [activeCurrency, setActiveCurrency] = useState<"MINIS" | "USD" | "ETB">("MINIS");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodKey, setPaymentMethodKey] = useState("");
  const [selectedDepositIndex, setSelectedDepositIndex] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutMethodKey, setPayoutMethodKey] = useState("");
  const [selectedPayoutIndex, setSelectedPayoutIndex] = useState("");
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);
  const [methodCurrency, setMethodCurrency] = useState<"USD" | "ETB">("USD");
  const [proofUrl, setProofUrl] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [depositCopyMessage, setDepositCopyMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [transferLink, setTransferLink] = useState<string | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<string>("");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const fileScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTransferHandledRef = useRef(0);
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
  const depositOptions = useMemo(
    () => depositMethodEntries.filter((entry) => entry.currency === methodCurrency),
    [depositMethodEntries, methodCurrency]
  );
  const payoutOptions = useMemo(() => {
    return payoutMethodEntries.filter((entry) => entry.currency === methodCurrency);
  }, [methodCurrency, payoutMethodEntries]);
  const selectedDepositMethod = useMemo(
    () => {
      if (!selectedDepositIndex) return undefined;
      const index = Number(selectedDepositIndex);
      return Number.isFinite(index) ? depositOptions[index] : undefined;
    },
    [depositOptions, selectedDepositIndex]
  );
  const selectedPayoutMethod = useMemo(() => {
    if (!selectedPayoutIndex) return undefined;
    const index = Number(selectedPayoutIndex);
    return Number.isFinite(index) ? payoutOptions[index] : undefined;
  }, [payoutOptions, selectedPayoutIndex]);
  const payoutMethodType = selectedPayoutMethod?.method || payoutMethod;
  const payoutFieldLabel = useMemo(() => {
    const method = selectedPayoutMethod?.method || payoutMethod;
    if (method === "BANK_TRANSFER" || method === "CBE") return "Bank account number";
    if (method === "MOBILE_MONEY" || method === "TELEBIRR") return "Phone number";
    if (method === "WALLET_ADDRESS") return "Wallet address";
    return "Account / wallet address";
  }, [payoutMethod, selectedPayoutMethod]);

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
    if (active !== "deposit" && active !== "withdraw") {
      setMinisValue("");
      setUsdValue("");
      setEtbValue("");
      setActiveCurrency("MINIS");
    }
    if (active !== "deposit") setIsDepositSubmitting(false);
    if (active !== "withdraw") setIsWithdrawSubmitting(false);
    if (active !== "withdraw") setPayoutMethod("");
    if (active !== "deposit") {
      setSelectedDepositIndex("");
      setPaymentMethod("");
      setPaymentMethodKey("");
    }
    if (active !== "withdraw") {
      setSelectedPayoutIndex("");
      setPayoutConfirmed(false);
    }
  }, [active]);

  useEffect(() => {
    if (activeCurrency === "USD" || activeCurrency === "ETB") {
      setMethodCurrency(activeCurrency);
    }
    if (selectedDepositIndex) {
      const index = Number(selectedDepositIndex);
      const entry = Number.isFinite(index) ? depositOptions[index] : undefined;
      if (!entry) {
        setSelectedDepositIndex("");
        setPaymentMethod("");
        setPaymentMethodKey("");
        return;
      }
      setPaymentMethod(entry.label || entry.method);
      setPaymentMethodKey(entry.key || `${entry.currency}-${entry.method}-${index}`);
    } else if (depositOptions.length === 1) {
      setSelectedDepositIndex("0");
    }
  }, [activeCurrency, selectedDepositIndex, depositOptions]);

  useEffect(() => {
    if (selectedPayoutIndex) {
      const index = Number(selectedPayoutIndex);
      const entry = Number.isFinite(index) ? payoutOptions[index] : undefined;
      if (!entry) {
        setSelectedPayoutIndex("");
        setPayoutMethod("");
        setPayoutMethodKey("");
        return;
      }
      setPayoutMethod(entry.label || entry.method);
      setPayoutMethodKey(entry.key || `${entry.currency}-${entry.method}-${index}`);
    } else if (payoutOptions.length === 1) {
      setSelectedPayoutIndex("0");
    }
  }, [payoutOptions, selectedPayoutIndex]);

  const updateAmountsFromMinis = useCallback(
    (minisRaw: string) => {
      const minis = Number(minisRaw);
      const minisPerUsd = fxSettings.minisPerUsd || 1;
      const usdToEtb = fxSettings.usdToEtb || 1;
      if (!Number.isFinite(minis)) {
        setMinisValue(minisRaw);
        setUsdValue("");
        setEtbValue("");
        return;
      }
      const usd = minis / minisPerUsd;
      const etb = usd * usdToEtb;
      setMinisValue(minisRaw);
      setUsdValue(usd ? usd.toFixed(2) : "");
      setEtbValue(etb ? etb.toFixed(2) : "");
    },
    [fxSettings.minisPerUsd, fxSettings.usdToEtb]
  );

  const updateAmountsFromUsd = useCallback(
    (usdRaw: string) => {
      const usd = Number(usdRaw);
      const minisPerUsd = fxSettings.minisPerUsd || 1;
      const usdToEtb = fxSettings.usdToEtb || 1;
      if (!Number.isFinite(usd)) {
        setUsdValue(usdRaw);
        setMinisValue("");
        setEtbValue("");
        return;
      }
      const minis = usd * minisPerUsd;
      const etb = usd * usdToEtb;
      setUsdValue(usdRaw);
      setMinisValue(minis ? minis.toFixed(2) : "");
      setEtbValue(etb ? etb.toFixed(2) : "");
    },
    [fxSettings.minisPerUsd, fxSettings.usdToEtb]
  );

  const updateAmountsFromEtb = useCallback(
    (etbRaw: string) => {
      const etb = Number(etbRaw);
      const minisPerUsd = fxSettings.minisPerUsd || 1;
      const usdToEtb = fxSettings.usdToEtb || 1;
      if (!Number.isFinite(etb)) {
        setEtbValue(etbRaw);
        setMinisValue("");
        setUsdValue("");
        return;
      }
      const usd = etb / usdToEtb;
      const minis = usd * minisPerUsd;
      setEtbValue(etbRaw);
      setUsdValue(usd ? usd.toFixed(2) : "");
      setMinisValue(minis ? minis.toFixed(2) : "");
    },
    [fxSettings.minisPerUsd, fxSettings.usdToEtb]
  );

  const resetDepositProof = useCallback(() => {
    setProofUrl("");
    setProofUploading(false);
    setProofError(null);
  }, []);

  const handleOpenAction = useCallback(
    (next: ActionType) => {
      setActive(next);
      if (next === "deposit") {
        setPaymentMethod("");
        resetDepositProof();
      }
    },
    [resetDepositProof]
  );

  const handleProofUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setProofError(null);
      setProofUploading(true);
      try {
        const uploadedUrl = await uploadFileToGcs(file, "deposit-proofs");
        setProofUrl(uploadedUrl);
      } catch (error) {
        setProofError(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setProofUploading(false);
      }
    },
    []
  );

  const handleDepositCopy = useCallback((value: string, label: string) => {
    if (!value) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(
        () => setDepositCopyMessage(`${label} copied`),
        () => setDepositCopyMessage("Copy failed")
      );
    } else {
      setDepositCopyMessage("Copy not supported");
    }
    window.setTimeout(() => setDepositCopyMessage(null), 1500);
  }, []);

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
    if (active === "deposit" && (depositState.status === "success" || depositState.status === "error")) {
      router.refresh();
    }
    if (active === "deposit" && depositState.status === "success") {
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    if (depositState.status !== "idle") {
      setIsDepositSubmitting(false);
    }
    return undefined;
  }, [active, depositState.status, router]);

  useEffect(() => {
    if (active === "withdraw" && (withdrawState.status === "success" || withdrawState.status === "error")) {
      router.refresh();
    }
    if (active === "withdraw" && withdrawState.status === "success") {
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    if (withdrawState.status !== "idle") {
      setIsWithdrawSubmitting(false);
    }
    return undefined;
  }, [active, withdrawState.status, router]);

  useEffect(() => {
    if (active === "send" && (transferState.status === "success" || transferState.status === "error")) {
      if (transferAttempt > lastTransferHandledRef.current) {
        router.refresh();
        lastTransferHandledRef.current = transferAttempt;
      }
      setTransferFeedback(transferState);
    }
    if (active === "send" && transferState.status === "success") {
      setRecipientValue("");
      setAmountValue("");
      setScanMessage(null);
    }
    if (transferState.status !== "idle") {
      setIsTransferSubmitting(false);
    }
    if (active === "send" && transferState.status === "error") {
      const timeout = setTimeout(() => setTransferFeedback(initialFormState), 2400);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [active, transferState.status, transferState.message, transferAttempt, router]);

  const parseTransferPayload = useCallback((raw: string) => {
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
  }, []);

  const handleScanResult = useCallback(
    (value: string) => {
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
    },
    [parseTransferPayload]
  );

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
        const mod = (await import("html5-qrcode")) as unknown as Html5QrcodeModule;
        if (cancelled) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const cameras = await Html5Qrcode.getCameras();
        const preferred = cameras?.find((cam) => /back|rear|environment/i.test(cam.label)) || cameras?.[0];
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
      } catch {
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
  }, [scannerOpen, active, handleScanResult]);

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

  async function handleFileScan(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanStatus("starting");
    setScanMessage("Scanning image…");
    try {
      const mod = (await import("html5-qrcode")) as unknown as Html5QrcodeModule;
      const Html5Qrcode = mod.Html5Qrcode;
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
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
          {actionList.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleOpenAction(action.key as ActionType)}
              className={`flex min-w-[90px] items-center justify-center rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] transition ${
                active === action.key
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
                  type="hidden"
                  name="amountMinis"
                  value={minisValue}
                />
                <input type="hidden" name="currency" value={activeCurrency} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">MINIS</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      required
                      value={minisValue}
                      onChange={(event) => {
                        setActiveCurrency("MINIS");
                        updateAmountsFromMinis(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">USD</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={usdValue}
                      onChange={(event) => {
                        setActiveCurrency("USD");
                        updateAmountsFromUsd(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">ETB</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={etbValue}
                      onChange={(event) => {
                        setActiveCurrency("ETB");
                        updateAmountsFromEtb(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                </div>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Payment method</span>
                  <div className="mb-2 flex items-center gap-2">
                    {(["USD", "ETB"] as const).map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => setMethodCurrency(currency)}
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          methodCurrency === currency
                            ? "border-black bg-black text-white"
                            : "border-black/15 text-gray-600"
                        }`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                  <select
                    required
                    value={selectedDepositIndex}
                    onChange={(event) => setSelectedDepositIndex(event.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                  >
                    <option value="" disabled>
                      Select method
                    </option>
                    {depositOptions.map((entry, index) => (
                      <option key={`${entry.currency}-${entry.method}-${index}`} value={String(index)}>
                        {entry.label || entry.method}
                      </option>
                    ))}
                  </select>
                </label>
                <input type="hidden" name="paymentMethod" value={paymentMethod} />
                <input type="hidden" name="paymentMethodKey" value={paymentMethodKey} />
                {selectedDepositMethod &&
                  (selectedDepositMethod.accountName ||
                    selectedDepositMethod.accountNumber ||
                    selectedDepositMethod.phoneNumber ||
                    selectedDepositMethod.walletAddress ||
                    selectedDepositMethod.instructions) && (
                    <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-xs text-gray-600">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                        Payment details
                      </p>
                      <div className="mt-2 space-y-1">
                        {selectedDepositMethod.accountName && (
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="text-gray-400">Account name:</span>{" "}
                              {selectedDepositMethod.accountName}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDepositCopy(selectedDepositMethod.accountName || "", "Account name")}
                              className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold text-gray-500"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        {selectedDepositMethod.accountNumber && (
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="text-gray-400">Account number:</span>{" "}
                              {selectedDepositMethod.accountNumber}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleDepositCopy(selectedDepositMethod.accountNumber || "", "Account number")
                              }
                              className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold text-gray-500"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        {selectedDepositMethod.phoneNumber && (
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="text-gray-400">Phone number:</span>{" "}
                              {selectedDepositMethod.phoneNumber}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleDepositCopy(selectedDepositMethod.phoneNumber || "", "Phone number")
                              }
                              className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold text-gray-500"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        {selectedDepositMethod.walletAddress && (
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="text-gray-400">Wallet address:</span>{" "}
                              {selectedDepositMethod.walletAddress}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleDepositCopy(selectedDepositMethod.walletAddress || "", "Wallet address")
                              }
                              className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-semibold text-gray-500"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                        {selectedDepositMethod.instructions && (
                          <p className="text-gray-500">{selectedDepositMethod.instructions}</p>
                        )}
                      </div>
                      {depositCopyMessage && <p className="mt-2 text-[10px] text-gray-400">{depositCopyMessage}</p>}
                    </div>
                  )}
                <input
                  name="paymentReference"
                  placeholder="Transaction reference"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <input type="hidden" name="proofUrl" value={proofUrl} />
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Upload proof</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofUpload}
                    className="w-full rounded-xl border border-black/10 px-3 py-2 text-xs text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                    required
                  />
                </label>
                {proofUploading && <p className="text-xs text-gray-500">Uploading proof...</p>}
                {!proofUploading && !proofUrl && <p className="text-xs text-gray-500">Receipt upload required.</p>}
                {proofError && <p className="text-xs text-red-500">{proofError}</p>}
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Notes to admin"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={isDepositSubmitting || proofUploading || !proofUrl || depositState.status === "success"}
                  className={`w-full rounded-full border border-[var(--surface-border)] px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isDepositSubmitting
                      ? "bg-black/80"
                      : depositState.status === "success"
                      ? "bg-emerald-600"
                      : depositState.status === "error"
                      ? "bg-red-600"
                      : "bg-black hover:bg-gray-900"
                  }`}
                >
                  {proofUploading
                    ? "Uploading proof…"
                    : isDepositSubmitting
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
                  type="hidden"
                  name="amountMinis"
                  value={minisValue}
                />
                <input type="hidden" name="currency" value={activeCurrency} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">MINIS</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      required
                      value={minisValue}
                      onChange={(event) => {
                        setActiveCurrency("MINIS");
                        updateAmountsFromMinis(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">USD</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={usdValue}
                      onChange={(event) => {
                        setActiveCurrency("USD");
                        updateAmountsFromUsd(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">ETB</span>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={etbValue}
                      onChange={(event) => {
                        setActiveCurrency("ETB");
                        updateAmountsFromEtb(event.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </label>
                </div>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Payout method</span>
                  <div className="mb-2 flex items-center gap-2">
                    {(["USD", "ETB"] as const).map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => setMethodCurrency(currency)}
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          methodCurrency === currency
                            ? "border-black bg-black text-white"
                            : "border-black/15 text-gray-600"
                        }`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                  <select
                    required
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
                    value={selectedPayoutIndex}
                    onChange={(event) => setSelectedPayoutIndex(event.target.value)}
                  >
                    <option value="" disabled>
                      Select method
                    </option>
                    {payoutOptions.map((entry, index) => (
                      <option key={`${entry.currency}-${entry.method}-${index}`} value={String(index)}>
                        {entry.label || entry.method}
                      </option>
                    ))}
                  </select>
                </label>
                <input type="hidden" name="payoutMethod" value={payoutMethod} />
                <input type="hidden" name="payoutMethodKey" value={payoutMethodKey} />
                <input type="hidden" name="payoutMethodType" value={payoutMethodType} />
                {(payoutMethodType === "BANK_TRANSFER" || payoutMethodType === "CBE") && (
                  <>
                    <input
                      name="accountName"
                      placeholder="Account name"
                      required
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                    <input
                      name="payoutBankName"
                      placeholder="Bank name"
                      required
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                    <input
                      name="payoutAccountNumber"
                      placeholder="Account number"
                      required
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </>
                )}
                {(payoutMethodType === "MOBILE_MONEY" || payoutMethodType === "TELEBIRR") && (
                  <>
                    <input
                      name="payoutPhone"
                      placeholder="Phone number"
                      required
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                    <input
                      name="accountName"
                      placeholder="Account name (optional)"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                    <input
                      name="payoutProviderName"
                      placeholder="Provider name (optional)"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </>
                )}
                {payoutMethodType === "WALLET_ADDRESS" && (
                  <>
                    <input
                      name="payoutAddress"
                      placeholder={payoutFieldLabel}
                      required={payoutMethodType === "WALLET_ADDRESS"}
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                    <input
                      name="payoutNetwork"
                      placeholder="Network (optional)"
                      className="w-full rounded-xl border border-black/10 px-3 py-2"
                    />
                  </>
                )}
                {selectedPayoutMethod?.instructions && (
                  <p className="text-xs text-gray-500">{selectedPayoutMethod.instructions}</p>
                )}
                <p className="text-xs text-gray-500">
                  Processing time:{" "}
                  {payoutProcessingTimes[payoutMethodType] || "1–3 business days"}
                  .
                </p>
                <label className="flex items-start gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={payoutConfirmed}
                    onChange={(event) => setPayoutConfirmed(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I confirm payout details are correct.</span>
                </label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Notes to admin"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={isWithdrawSubmitting || withdrawState.status === "success" || !payoutConfirmed}
                  className={`w-full rounded-full border border-[var(--surface-border)] px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
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
                  onSubmit={() => {
                    setIsTransferSubmitting(true);
                    setTransferFeedback(initialFormState);
                    setTransferAttempt((prev) => prev + 1);
                  }}
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
                    min={0.01}
                    step={0.01}
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
                    disabled={isTransferSubmitting || transferFeedback.status === "success"}
                    className={`w-full rounded-full border border-[var(--surface-border)] px-3 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      isTransferSubmitting
                        ? "bg-black/80"
                        : transferFeedback.status === "success"
                        ? "bg-emerald-600"
                        : transferFeedback.status === "error"
                        ? "bg-red-600"
                        : "bg-black hover:bg-gray-900"
                    }`}
                  >
                    {isTransferSubmitting
                      ? "Sending…"
                      : transferFeedback.status === "success"
                      ? "Success ✓"
                      : transferFeedback.status === "error"
                      ? "Try again ↻"
                      : "Send transfer"}
                  </button>
                  {transferFeedback.status !== "idle" && (
                    <p
                      className={`text-xs ${
                        transferFeedback.status === "success" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {transferFeedback.status === "success" ? "✓ " : "✕ "}
                      {transferFeedback.message}
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
                      min={0.01}
                      step={0.01}
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
                      <Image
                        src={qrDataUrl}
                        alt="Transfer QR"
                        width={192}
                        height={192}
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

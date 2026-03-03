"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";
import { ClanSelector } from "@/components/clan-selector";
import { RuneSelector } from "@/components/rune-selector";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import type { ReceiptExtraction } from "@/lib/types";

export default function CapturePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clan, setClan] = useState("");
  const [rune, setRune] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  async function handleSubmit() {
    if (!imageBase64 || !imageFile || !clan || !rune) {
      showToast("Please capture an image and select Clan and Rune", "warning");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", imageFile);

      const res = await fetch("/api/receipt/extract", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        // Navigate to review with extraction data
        const extraction: ReceiptExtraction = result.data;
        sessionStorage.setItem(
          "skattbok-review",
          JSON.stringify({
            extraction,
            imageBase64,
            clan,
            rune,
          })
        );
        router.push("/capture/review");
      } else if (result.fallback) {
        showToast(
          "The ravens couldn't read this scroll. Enter the details by hand.",
          "warning"
        );
        setManualEntry(true);
      } else {
        showToast(result.error || "Extraction failed", "error");
      }
    } catch {
      showToast("Failed to process receipt", "error");
      setManualEntry(true);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit() {
    sessionStorage.setItem(
      "skattbok-review",
      JSON.stringify({
        extraction: null,
        imageBase64,
        clan,
        rune,
      })
    );
    router.push("/capture/review");
  }

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-norse-gold">
          Record the Spoils
        </h1>
        <p className="mb-6 text-sm text-norse-text-muted">
          Capture a receipt or enter manually
        </p>

        <div className="flex flex-col gap-5">
          <CameraCapture
            onCapture={(base64, file) => {
              setImageBase64(base64);
              setImageFile(file);
            }}
          />

          <ClanSelector value={clan} onChange={setClan} />
          <RuneSelector value={rune} onChange={setRune} />

          {!manualEntry ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !imageBase64 || !clan || !rune}
              className="w-full rounded-lg bg-norse-gold px-4 py-3 font-bold text-norse-bg disabled:opacity-50"
            >
              {loading
                ? "The ravens are reading your scroll..."
                : "Submit for Extraction"}
            </button>
          ) : (
            <button
              onClick={handleManualSubmit}
              disabled={!clan || !rune}
              className="w-full rounded-lg bg-norse-gold px-4 py-3 font-bold text-norse-bg disabled:opacity-50"
            >
              Enter Manually
            </button>
          )}

          {!manualEntry && (
            <button
              onClick={() => {
                setManualEntry(true);
              }}
              className="text-center text-sm text-norse-text-muted underline"
            >
              Skip AI — enter manually
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

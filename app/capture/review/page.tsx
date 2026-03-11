"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/expense-form";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/components/toast";
import { saveDraft } from "@/lib/draft-storage";
import type { Expense, ReceiptExtraction } from "@/lib/types";

interface ReviewData {
  extraction: ReceiptExtraction | null;
  imageBase64: string | null;
  clan: string;
  rune: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [pendingData, setPendingData] = useState<Partial<Expense> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("skattbok-review");
    if (raw) {
      setReviewData(JSON.parse(raw));
    } else {
      router.push("/capture");
    }
  }, [router]);

  async function handleSave(
    data: Partial<Expense>,
    skipDuplicateCheck = false
  ) {
    setSaving(true);
    try {
      const formData = new FormData();

      const expensePayload = {
        ...data,
        entity: reviewData?.clan,
        category: data.category || reviewData?.rune,
        skipDuplicateCheck,
      };
      formData.append("expense", JSON.stringify(expensePayload));

      // Convert base64 back to blob for upload
      if (reviewData?.imageBase64) {
        const binaryStr = atob(reviewData.imageBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/jpeg" });
        formData.append("image", blob, "receipt.jpg");
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.duplicate && !skipDuplicateCheck) {
        setPendingData(data);
        setDuplicateModal(true);
        return;
      }

      if (result.success) {
        sessionStorage.removeItem("skattbok-review");
        showToast("Expense etched in stone!", "success");
        router.push("/hall");
      } else if (res.status === 401 || result.code === "GOOGLE_NOT_CONNECTED") {
        showToast(
          result.error || "Google account not connected. Connect Google in Settings to save expenses.",
          "error"
        );
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      // Save as draft on failure
      saveDraft(data, reviewData?.imageBase64 ?? undefined);
      const errMsg = error instanceof Error ? error.message : "";
      showToast(
        errMsg || "Failed to save. Draft preserved — will retry later.",
        "error"
      );
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  if (!reviewData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-norse-bg">
        <p className="text-norse-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-norse-bg pb-24 pt-safe">
      <div className="px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-norse-gold">
          Review the Spoils
        </h1>
        <p className="mb-6 text-sm text-norse-text-muted">
          {reviewData.extraction
            ? "Verify the extracted data"
            : "Enter expense details manually"}
        </p>

        <ExpenseForm
          extraction={reviewData.extraction ?? undefined}
          imagePreview={
            reviewData.imageBase64
              ? `data:image/jpeg;base64,${reviewData.imageBase64}`
              : undefined
          }
          initialData={{
            category: reviewData.rune,
          }}
          initialEntity={reviewData.clan}
          onSave={(data) => handleSave(data)}
          saving={saving}
        />
      </div>

      <ConfirmationModal
        open={duplicateModal}
        title="Duplicate Detected"
        message="An expense with the same vendor, date, and total already exists. Save anyway?"
        confirmLabel="Save Anyway"
        cancelLabel="Go Back"
        variant="warning"
        onConfirm={() => {
          setDuplicateModal(false);
          if (pendingData) handleSave(pendingData, true);
        }}
        onCancel={() => setDuplicateModal(false)}
      />

      <BottomNav />
    </div>
  );
}

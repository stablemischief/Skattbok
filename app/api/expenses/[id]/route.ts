import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";
import {
  getOrCreateSpreadsheet,
  getExpenses,
  updateExpenseRow,
  deleteExpenseRow,
} from "@/lib/google-sheets";
import { deleteFile } from "@/lib/google-drive";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = await getGoogleAccessToken();

    const entity = body.entity || body.clan;
    const year = parseInt(
      (body.date || new Date().toISOString().split("T")[0]).split("-")[0]
    );

    if (!entity) {
      return NextResponse.json(
        { error: "Entity (clan) is required" },
        { status: 400 }
      );
    }

    const spreadsheetId = await getOrCreateSpreadsheet(entity, year, token);
    const expenses = await getExpenses(spreadsheetId, token);
    const rowIndex = expenses.findIndex((e) => e.id === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: `Expense ${id} not found` }, { status: 404 });
    }
    const existingExpense = expenses[rowIndex];

    const updatedExpense = {
      ...existingExpense,
      ...body,
      id, // Preserve ID
      createdAt: existingExpense.createdAt, // Preserve creation date
    };

    await updateExpenseRow(spreadsheetId, rowIndex, updatedExpense, token);

    return NextResponse.json({ success: true, data: updatedExpense });
  } catch (error) {
    console.error("Update expense error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Not authenticated") ||
      message.includes("Google account not connected")) {
      return NextResponse.json({ error: message, code: "GOOGLE_NOT_CONNECTED" }, { status: 401 });
    }
    return NextResponse.json(
      { error: message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear())
    );

    if (!entity) {
      return NextResponse.json(
        { error: "Entity (clan) is required" },
        { status: 400 }
      );
    }

    const token = await getGoogleAccessToken();
    const spreadsheetId = await getOrCreateSpreadsheet(entity, year, token);
    const expenses = await getExpenses(spreadsheetId, token);
    const rowIndex = expenses.findIndex((e) => e.id === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: `Expense ${id} not found` }, { status: 404 });
    }
    const expense = expenses[rowIndex];

    // Delete image from Drive if it exists
    if (expense.imageUrl) {
      try {
        // Extract file ID from Google Drive URL
        const match = expense.imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          await deleteFile(match[1], token);
        }
      } catch (imgErr) {
        // Image deletion is best-effort
        console.warn("Failed to delete image from Drive:", imgErr);
      }
    }

    await deleteExpenseRow(spreadsheetId, rowIndex, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Not authenticated") ||
      message.includes("Google account not connected")) {
      return NextResponse.json({ error: message, code: "GOOGLE_NOT_CONNECTED" }, { status: 401 });
    }
    return NextResponse.json(
      { error: message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}

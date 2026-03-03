import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";
import { getOrCreateSpreadsheet, getExpenses } from "@/lib/google-sheets";
import type { Expense } from "@/lib/types";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toStandardCSV(expenses: Expense[]): string {
  const headers = [
    "ID",
    "Date",
    "Vendor",
    "Description",
    "Category",
    "Amount",
    "Tax",
    "Total",
    "Payment Method",
    "Card Nickname",
    "Notes",
    "Image URL",
    "Created At",
  ];
  const rows = expenses.map((e) =>
    [
      e.id,
      e.date,
      e.vendor,
      e.description,
      e.category,
      String(e.amount),
      String(e.tax),
      String(e.total),
      e.paymentMethod,
      e.cardNickname,
      e.notes,
      e.imageUrl,
      e.createdAt,
    ]
      .map(escapeCSV)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function toQuickBooksCSV(expenses: Expense[]): string {
  const headers = ["Date", "Description", "Amount", "Category"];
  const rows = expenses.map((e) =>
    [
      e.date,
      `${e.vendor}${e.description ? " - " + e.description : ""}`,
      String(e.total),
      e.category,
    ]
      .map(escapeCSV)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear())
    );
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") ?? "standard";

    if (!entity) {
      return NextResponse.json(
        { error: "Entity (clan) is required" },
        { status: 400 }
      );
    }

    const token = await getGoogleAccessToken();
    const spreadsheetId = await getOrCreateSpreadsheet(entity, year, token);
    let expenses = await getExpenses(spreadsheetId, token);

    // Filter by date range
    if (from) {
      expenses = expenses.filter((e) => e.date >= from);
    }
    if (to) {
      expenses = expenses.filter((e) => e.date <= to);
    }

    const csv =
      format === "quickbooks"
        ? toQuickBooksCSV(expenses)
        : toStandardCSV(expenses);

    const filename = `${entity}-${year}-expenses${format === "quickbooks" ? "-qb" : ""}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Not authenticated") || message.includes("No Google OAuth token")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    );
  }
}

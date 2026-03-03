import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getGoogleAccessToken } from "@/lib/google-auth";
import {
  getOrCreateSpreadsheet,
  appendExpenseRow,
  getExpenses,
  findDuplicates,
} from "@/lib/google-sheets";
import {
  getOrCreateFolderPath,
  uploadReceiptImage,
  buildDriveFolderPath,
} from "@/lib/google-drive";
import { ExpenseSchema } from "@/lib/types";
import type { Expense } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    if (!entity) {
      return NextResponse.json(
        { error: "Entity (clan) is required" },
        { status: 400 }
      );
    }

    const token = await getGoogleAccessToken();
    const spreadsheetId = await getOrCreateSpreadsheet(entity, year, token);
    const expenses = await getExpenses(spreadsheetId, token);

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Not authenticated") || message.includes("No Google OAuth token")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const expenseDataRaw = formData.get("expense");
    const imageFile = formData.get("image");

    if (!expenseDataRaw || typeof expenseDataRaw !== "string") {
      return NextResponse.json(
        { error: "Expense data is required" },
        { status: 400 }
      );
    }

    let expenseInput;
    try {
      expenseInput = JSON.parse(expenseDataRaw);
    } catch {
      return NextResponse.json(
        { error: "Invalid expense data format" },
        { status: 400 }
      );
    }
    const token = await getGoogleAccessToken();

    const now = new Date();
    const expenseDate = expenseInput.date || now.toISOString().split("T")[0];
    const year = parseInt(expenseDate.split("-")[0]);
    const entity = expenseInput.entity || expenseInput.clan;

    if (!entity) {
      return NextResponse.json(
        { error: "Entity (clan) is required" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const spreadsheetId = await getOrCreateSpreadsheet(entity, year, token);
    const duplicates = await findDuplicates(
      spreadsheetId,
      expenseInput.vendor || "",
      expenseDate,
      expenseInput.total || 0,
      token
    );

    if (duplicates.length > 0 && !expenseInput.skipDuplicateCheck) {
      return NextResponse.json({
        success: false,
        duplicate: true,
        data: duplicates,
        error: "Potential duplicate found. Set skipDuplicateCheck to proceed.",
      });
    }

    // Upload image to Drive if provided
    let imageUrl = "";
    if (imageFile && imageFile instanceof File) {
      const folderPath = buildDriveFolderPath(entity, year);
      const folderId = await getOrCreateFolderPath(folderPath, token);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${uuidv4()}-${expenseDate}.jpg`;
      const result = await uploadReceiptImage(
        folderId,
        buffer,
        filename,
        token
      );
      imageUrl = result.webViewLink;
    }

    const expense: Expense = {
      id: uuidv4(),
      date: expenseDate,
      vendor: expenseInput.vendor || "",
      description: expenseInput.description || "",
      category: expenseInput.category || "",
      amount: expenseInput.amount || 0,
      tax: expenseInput.tax || 0,
      total: expenseInput.total || 0,
      paymentMethod: expenseInput.paymentMethod || "",
      cardNickname: expenseInput.cardNickname || "",
      notes: expenseInput.notes || "",
      imageUrl,
      createdAt: now.toISOString(),
    };

    const parseResult = ExpenseSchema.safeParse(expense);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid expense data", details: parseResult.error.flatten() },
        { status: 422 }
      );
    }
    await appendExpenseRow(spreadsheetId, expense, token);

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error("Create expense error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Not authenticated") || message.includes("No Google OAuth token")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to save expense" },
      { status: 500 }
    );
  }
}

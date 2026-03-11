import { getGoogleSheetsClient } from "./google-auth";
import { GOOGLE_SHEETS_HEADERS } from "./defaults";
import type { Expense } from "./types";

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function expenseToRow(expense: Expense): string[] {
  return [
    expense.id,
    expense.date,
    expense.vendor,
    expense.description,
    expense.category,
    String(expense.amount),
    String(expense.tax),
    String(expense.tip),
    String(expense.total),
    expense.paymentMethod,
    expense.cardNickname,
    expense.notes,
    expense.imageUrl,
    expense.createdAt,
  ];
}

function rowToExpense(row: string[]): Expense {
  // Handle both old 13-column rows (no tip) and new 14-column rows
  const hasTip = row.length >= 14;
  const offset = hasTip ? 1 : 0;
  return {
    id: row[0] ?? "",
    date: row[1] ?? "",
    vendor: row[2] ?? "",
    description: row[3] ?? "",
    category: row[4] ?? "",
    amount: parseFloat(row[5]) || 0,
    tax: parseFloat(row[6]) || 0,
    tip: hasTip ? parseFloat(row[7]) || 0 : 0,
    total: parseFloat(row[7 + offset]) || 0,
    paymentMethod: row[8 + offset] ?? "",
    cardNickname: row[9 + offset] ?? "",
    notes: row[10 + offset] ?? "",
    imageUrl: row[11 + offset] ?? "",
    createdAt: row[12 + offset] ?? "",
  };
}

export async function getOrCreateSpreadsheet(
  entityName: string,
  year: number,
  token: string
): Promise<string> {
  const sheets = getGoogleSheetsClient(token);
  const title = `${entityName} - ${year}`;

  // Search for existing spreadsheet
  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const searchResult = await drive.files.list({
    q: `name='${escapeDriveQuery(title)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id,name)",
    spaces: "drive",
  });

  if (searchResult.data.files && searchResult.data.files.length > 0) {
    const existingId = searchResult.data.files[0].id;
    if (!existingId) throw new Error(`Google Drive: spreadsheet "${title}" found but has no ID`);
    return existingId;
  }

  // Create new spreadsheet with headers
  const createResult = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        {
          properties: { title: "Expenses" },
        },
      ],
    },
  });

  const spreadsheetId = createResult.data.spreadsheetId;
  if (!spreadsheetId) throw new Error(`Google Sheets: created spreadsheet "${title}" but got no ID`);

  // Move spreadsheet into entity folder (non-fatal — spreadsheet is usable at root)
  try {
    const { getOrCreateFolderPath } = await import("./google-drive");
    const folderId = await getOrCreateFolderPath(
      ["Expense-App", entityName],
      token
    );
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      removeParents: "root",
      fields: "id, parents",
    });
  } catch (err) {
    console.warn(`Failed to move spreadsheet "${title}" into folder:`, err);
  }

  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Expenses!A1:N1",
    valueInputOption: "RAW",
    requestBody: {
      values: [GOOGLE_SHEETS_HEADERS as unknown as string[]],
    },
  });

  return spreadsheetId;
}

export async function appendExpenseRow(
  spreadsheetId: string,
  expense: Expense,
  token: string
): Promise<void> {
  const sheets = getGoogleSheetsClient(token);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Expenses!A:N",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [expenseToRow(expense)],
    },
  });
}

export async function getExpenses(
  spreadsheetId: string,
  token: string
): Promise<Expense[]> {
  const sheets = getGoogleSheetsClient(token);
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Expenses!A2:N",
  });

  const rows = result.data.values;
  if (!rows || rows.length === 0) return [];

  return rows.map((row) => rowToExpense(row));
}

export async function updateExpenseRow(
  spreadsheetId: string,
  rowIndex: number,
  expense: Expense,
  token: string
): Promise<void> {
  const sheets = getGoogleSheetsClient(token);
  // rowIndex is 0-based from data rows, Sheet row = rowIndex + 2 (header + 1-based)
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Expenses!A${sheetRow}:N${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [expenseToRow(expense)],
    },
  });
}

export async function deleteExpenseRow(
  spreadsheetId: string,
  rowIndex: number,
  token: string
): Promise<void> {
  const sheets = getGoogleSheetsClient(token);
  // Get the sheet ID first
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

  // Delete the row (rowIndex is 0-based from data, sheet row = rowIndex + 1 for 0-based sheet index)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1, // +1 for header row
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
}

export async function findDuplicates(
  spreadsheetId: string,
  vendor: string,
  date: string,
  total: number,
  token: string
): Promise<Expense[]> {
  const expenses = await getExpenses(spreadsheetId, token);
  return expenses.filter(
    (e) =>
      e.vendor.toLowerCase() === vendor.toLowerCase() &&
      e.date === date &&
      Math.abs(e.total - total) < 0.01
  );
}

export async function findExpenseRowIndex(
  spreadsheetId: string,
  expenseId: string,
  token: string
): Promise<number> {
  const expenses = await getExpenses(spreadsheetId, token);
  const index = expenses.findIndex((e) => e.id === expenseId);
  if (index === -1) throw new Error(`Expense ${expenseId} not found`);
  return index;
}

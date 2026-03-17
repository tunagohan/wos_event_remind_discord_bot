import { google, sheets_v4 } from "googleapis";

const DEFAULT_SPREADSHEET_ID = "1aBTrWLYX_hBdtNAVJOvmo9Sxeb_kc2OYfaYrZ3il184";
const DEFAULT_TEMPLATE_SHEET_NAME = "テンプレート";
const TRANSFER_CATEGORIES = ["特別枠", "普通枠"] as const;

export type TransferCategory = (typeof TRANSFER_CATEGORIES)[number];

export type TransferRow = {
  category: TransferCategory;
  userName: string;
  userId: string;
  serverId: string;
  note: string;
};

type SheetInfo = {
  sheetId: number;
  title: string;
};

function getSpreadsheetId(): string {
  return process.env.TRANSFER_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
}

function getTemplateSheetName(): string {
  return process.env.TRANSFER_TEMPLATE_SHEET_NAME || DEFAULT_TEMPLATE_SHEET_NAME;
}

function getGoogleCredentials() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON;
  if (json) {
    const parsed = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON must include client_email and private_key.");
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error(
      "Missing Google Sheets credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }

  return {
    client_email: email,
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function sanitizeSheetName(sheetName: string): string {
  const trimmed = sheetName.trim();
  if (!trimmed) throw new Error("シート名を入力してください。");
  if (trimmed.length > 100) throw new Error("シート名は100文字以内で指定してください。");
  if (/[\\/?*[\]:]/.test(trimmed)) {
    throw new Error("シート名に使用できない文字が含まれています。");
  }
  return trimmed;
}

function getCell(rows: sheets_v4.Schema$ValueRange["values"], rowIndex: number, colIndex: number): string {
  const cell = rows?.[rowIndex]?.[colIndex];
  return typeof cell === "string" ? cell : cell == null ? "" : String(cell);
}

async function getSheetInfoByName(sheetName: string): Promise<SheetInfo | null> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.sheetId,sheets.properties.title",
  });

  const properties = res.data.sheets?.find((sheet) => sheet.properties?.title === sheetName)?.properties;
  if (typeof properties?.sheetId !== "number" || !properties.title) return null;

  return {
    sheetId: properties.sheetId,
    title: properties.title,
  };
}

export async function listTransferSheets(): Promise<string[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const templateSheetName = getTemplateSheetName();
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  return (res.data.sheets ?? [])
    .map((sheet) => sheet.properties?.title?.trim() ?? "")
    .filter((title) => title !== "" && title !== templateSheetName);
}

async function requireSheetInfo(sheetName: string): Promise<SheetInfo> {
  const info = await getSheetInfoByName(sheetName);
  if (!info) throw new Error(`シートが見つかりません: ${sheetName}`);
  return info;
}

function getLastPopulatedRowFromBtoD(rows: sheets_v4.Schema$ValueRange["values"]): number {
  if (!rows) return 0;

  let lastRow = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    if (row.some((cell) => String(cell ?? "").trim() !== "")) {
      lastRow = i + 1;
    }
  }

  return lastRow;
}

export async function createTransferSheet(sheetName: string): Promise<string> {
  const sanitizedName = sanitizeSheetName(sheetName);
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (await getSheetInfoByName(sanitizedName)) {
    throw new Error(`同名のシートが既に存在します: ${sanitizedName}`);
  }

  const template = await getSheetInfoByName(getTemplateSheetName());
  if (!template) {
    throw new Error(`テンプレートシートが見つかりません: ${getTemplateSheetName()}`);
  }

  const copied = await sheets.spreadsheets.sheets.copyTo({
    spreadsheetId,
    sheetId: template.sheetId,
    requestBody: {
      destinationSpreadsheetId: spreadsheetId,
    },
  });

  if (typeof copied.data.sheetId !== "number") {
    throw new Error("テンプレートシートのコピーに失敗しました。");
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: copied.data.sheetId,
              title: sanitizedName,
            },
            fields: "title",
          },
        },
      ],
    },
  });

  return sanitizedName;
}

export async function addTransferMember(input: {
  sheetName: string;
  category: TransferCategory;
  userName: string;
  userId?: string;
  serverId: string;
  note?: string;
}): Promise<number> {
  const sheetName = sanitizeSheetName(input.sheetName);
  const userName = input.userName.trim();
  const userId = (input.userId ?? "").trim();
  const serverId = input.serverId.trim();
  const note = (input.note ?? "").trim();

  if (!TRANSFER_CATEGORIES.includes(input.category)) {
    throw new Error("ジャンルは 特別枠 または 普通枠 を指定してください。");
  }
  if (!userName) throw new Error("ユーザー名を入力してください。");
  if (!serverId) throw new Error("サーバーIDを入力してください。");

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await requireSheetInfo(sheetName);

  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!B:D`,
  });

  const targetRow = getLastPopulatedRowFromBtoD(valuesRes.data.values) + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!A${targetRow}:E${targetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[input.category, userName, userId, serverId, note]],
    },
  });

  return targetRow;
}

export async function getTransferSheetSummary(sheetName: string): Promise<{
  specialCount: string;
  normalCount: string;
  users: TransferRow[];
}> {
  const sanitizedName = sanitizeSheetName(sheetName);
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await requireSheetInfo(sanitizedName);

  const [countsRes, rowsRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sanitizedName}'!B1:B2`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sanitizedName}'!A:E`,
    }),
  ]);

  const countValues = countsRes.data.values ?? [];
  const users: TransferRow[] = [];

  for (const row of rowsRes.data.values ?? []) {
    const category = row[0]?.trim();
    if (category !== "特別枠" && category !== "普通枠") continue;

    users.push({
      category,
      userName: row[1] ?? "",
      userId: row[2] ?? "",
      serverId: row[3] ?? "",
      note: row[4] ?? "",
    });
  }

  return {
    specialCount: getCell(countValues, 0, 0) || "0",
    normalCount: getCell(countValues, 1, 0) || "0",
    users,
  };
}

export async function deleteTransferMember(sheetName: string, userId: string): Promise<number> {
  const sanitizedName = sanitizeSheetName(sheetName);
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) throw new Error("ユーザーIDを入力してください。");

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetInfo = await requireSheetInfo(sanitizedName);

  const rowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sanitizedName}'!C:C`,
  });

  const values = rowsRes.data.values ?? [];
  const rowIndex = values.findIndex((row) => (row[0] ?? "").trim() === normalizedUserId);
  if (rowIndex === -1) {
    throw new Error(`ユーザーID ${normalizedUserId} は ${sanitizedName} に見つかりませんでした。`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetInfo.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  return rowIndex + 1;
}

export function isTransferCategory(value: string): value is TransferCategory {
  return TRANSFER_CATEGORIES.includes(value as TransferCategory);
}

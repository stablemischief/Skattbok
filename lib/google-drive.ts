import { Readable } from "stream";
import { getGoogleDriveClient } from "./google-auth";
import { GOOGLE_DRIVE_ROOT_FOLDER } from "./defaults";

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(
  drive: ReturnType<typeof getGoogleDriveClient>,
  name: string,
  parentId?: string
): Promise<string | null> {
  const parentQuery = parentId
    ? `and '${parentId}' in parents`
    : "and 'root' in parents";
  const result = await drive.files.list({
    q: `name='${escapeDriveQuery(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false ${parentQuery}`,
    fields: "files(id,name)",
    spaces: "drive",
  });
  return result.data.files?.[0]?.id ?? null;
}

async function createFolder(
  drive: ReturnType<typeof getGoogleDriveClient>,
  name: string,
  parentId?: string
): Promise<string> {
  const result = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  const id = result.data.id;
  if (!id) throw new Error(`Google Drive: folder creation returned no ID for "${name}"`);
  return id;
}

export async function getOrCreateFolderPath(
  path: string[],
  token: string
): Promise<string> {
  const drive = getGoogleDriveClient(token);
  let parentId: string | undefined;

  for (const folderName of path) {
    const existingId = await findFolder(drive, folderName, parentId);
    if (existingId) {
      parentId = existingId;
    } else {
      parentId = await createFolder(drive, folderName, parentId);
    }
  }

  return parentId!;
}

export async function uploadReceiptImage(
  folderId: string,
  imageBuffer: Buffer,
  filename: string,
  token: string
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getGoogleDriveClient(token);

  const result = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "image/jpeg",
      body: Readable.from(imageBuffer),
    },
    fields: "id,webViewLink",
  });

  const fileId = result.data.id;
  if (!fileId) throw new Error("Google Drive: file upload returned no ID");

  return {
    fileId,
    webViewLink: result.data.webViewLink ?? "",
  };
}

export async function deleteFile(
  fileId: string,
  token: string
): Promise<void> {
  const drive = getGoogleDriveClient(token);
  await drive.files.delete({ fileId });
}

export function buildDriveFolderPath(
  entityName: string,
  year: number
): string[] {
  return [GOOGLE_DRIVE_ROOT_FOLDER, entityName, "images", String(year)];
}

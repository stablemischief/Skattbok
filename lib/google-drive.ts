import { Readable } from "stream";
import { getGoogleDriveClient } from "./google-auth";
import { GOOGLE_DRIVE_ROOT_FOLDER } from "./defaults";

async function findFolder(
  drive: ReturnType<typeof getGoogleDriveClient>,
  name: string,
  parentId?: string
): Promise<string | null> {
  const parentQuery = parentId
    ? `and '${parentId}' in parents`
    : "and 'root' in parents";
  const result = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false ${parentQuery}`,
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
  return result.data.id!;
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

  const fileId = result.data.id!;

  // Make publicly viewable
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // Fetch webViewLink
  const fileInfo = await drive.files.get({
    fileId,
    fields: "webViewLink",
  });

  return {
    fileId,
    webViewLink: fileInfo.data.webViewLink!,
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

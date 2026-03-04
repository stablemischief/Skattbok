import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function getGoogleAccessToken(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  let tokens;
  try {
    const client = await clerkClient();
    tokens = await client.users.getUserOauthAccessToken(
      userId,
      "google" // changed from oauth_google — Clerk v6 uses provider name
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Clerk Google OAuth error:", msg);
    throw new Error(
      "Google account not connected. Connect Google in Settings to save expenses."
    );
  }

  if (!tokens.data || tokens.data.length === 0) {
    throw new Error(
      "Google account not connected. Connect Google in Settings to save expenses."
    );
  }

  return tokens.data[0].token;
}

export function getGoogleSheetsClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

export function getGoogleDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

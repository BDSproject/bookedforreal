import { OAuth2Client } from "google-auth-library";

export interface GoogleIdentity {
  email: string;
  googleId: string;
  name: string;
}

/**
 * Verifies the ID token returned by Google Identity Services ("Sign in with
 * Google") and extracts the user's identity. Returns `null` when Google is not
 * configured or the token is invalid.
 */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleIdentity | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    return null;
  }

  return {
    email: payload.email,
    googleId: payload.sub,
    name: payload.name ?? payload.email.split("@")[0] ?? payload.email,
  };
}

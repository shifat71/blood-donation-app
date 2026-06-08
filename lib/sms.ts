/**
 * BD HTTP gateway SMS client.
 *
 * Compatible with providers that accept a GET/POST request with query params
 * (SSL Wireless, BulkSMSBD, Mim SMS, etc.). The exact param names vary by
 * provider — adjust SMS_PARAM_TO / SMS_PARAM_MSG / SMS_PARAM_KEY if yours
 * differs from the defaults below.
 *
 * Required env vars:
 *   SMS_API_URL   — full base URL, e.g. https://api.bulksmsbd.net/api/smsapi
 *   SMS_API_KEY   — your API key / token
 *
 * Optional:
 *   SMS_SENDER_ID  — sender name / number (default: "BloodApp")
 *   SMS_PARAM_TO   — query param name for the recipient number (default: "number")
 *   SMS_PARAM_MSG  — query param name for the message body   (default: "message")
 *   SMS_PARAM_KEY  — query param name for the API key        (default: "api_key")
 *   SMS_METHOD     — "GET" or "POST" (default: "GET")
 */

function isConfigured(): boolean {
  return !!(process.env.SMS_API_URL && process.env.SMS_API_KEY);
}

export async function sendSms(to: string, message: string): Promise<void> {
  if (!isConfigured()) return; // silently skip — SMS is optional

  const apiUrl = process.env.SMS_API_URL!;
  const apiKey = process.env.SMS_API_KEY!;
  const senderId = process.env.SMS_SENDER_ID ?? 'BloodApp';
  const paramTo = process.env.SMS_PARAM_TO ?? 'number';
  const paramMsg = process.env.SMS_PARAM_MSG ?? 'message';
  const paramKey = process.env.SMS_PARAM_KEY ?? 'api_key';
  const method = (process.env.SMS_METHOD ?? 'GET').toUpperCase();

  const params = new URLSearchParams({
    [paramKey]: apiKey,
    [paramTo]: to,
    [paramMsg]: message,
    senderid: senderId,
  });

  const response = await fetch(
    method === 'GET' ? `${apiUrl}?${params}` : apiUrl,
    {
      method,
      ...(method === 'POST' && {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`SMS gateway returned ${response.status}: ${await response.text()}`);
  }
}

/**
 * Send SMS best-effort — logs failures but never throws.
 * Use this in transactional flows so an SMS failure never blocks the main action.
 */
export async function sendSmsSafe(to: string | null | undefined, message: string): Promise<void> {
  if (!to) return;
  try {
    await sendSms(to, message);
  } catch (err) {
    console.error('SMS send failed:', err instanceof Error ? err.message : err);
  }
}

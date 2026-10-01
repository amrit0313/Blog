import { getEnvConfig } from "../config/env.config";

const { BREVO_API_KEY } = getEnvConfig();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Export a reusable function
export async function sendResetMail(
  userEmail: string,
  name: string,
  token: string,
) {
  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not set");
    }
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Nepal Can Blog",
          email: "workamrtz@gmail.com", // must be a verified sender in Brevo
        },
        to: [{ email: userEmail, name }],
        subject: `Reset your password, ${name}!`,
        htmlContent: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #333;">
    <h2 style="color: #dc2626; margin-bottom: 16px;">
      Reset your Nepal Can Blog password
    </h2>

    <p style="font-size: 16px; line-height: 1.6;">
      We received a request to reset your password.
      Click the button below to create a new password.
    </p>

    <div style="margin: 32px 0;">
      <a
        href="${process.env.FRONTEND_URL}/reset-password/${token}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #dc2626;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        "
      >
        Reset Password
      </a>
    </div>

    <p style="font-size: 14px; color: #666; line-height: 1.5;">
      This link will expire shortly for security reasons.
      If you didn't request a password reset, you can safely ignore this email.
    </p>

    <p style="font-size: 14px; color: #999; margin-top: 32px;">
      — The Nepal Can Team
    </p>
  </div>
`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send email:", result);
      return { success: false, error: result };
    }

    return { success: true, data: result }; // result.messageId on success
  } catch (err) {
    console.log(err);
    return { success: false, error: err };
  }
}

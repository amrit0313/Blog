import { getEnvConfig } from "../config/env.config";

const { BREVO_API_KEY } = getEnvConfig();
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/+$/, "");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendVerificationMail(
  userEmail: string,
  name: string,
  token: string,
) {
  try {
    if (!FRONTEND_URL) {
      throw new Error("FRONTEND_URL is not set");
    }
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
          email: "workamrtz@gmail.com",
        },
        to: [{ email: userEmail, name }],
        subject: "Verify your Nepal Can Blog email",
        htmlContent: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #333;">
    <h2>Verify your email address</h2>
    <p>Hi ${name}, confirm your email address to activate your account.</p>
    <p><a href="${FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}">Verify email</a></p>
    <p>This link expires in 30 minutes. If you did not create this account, you can ignore this email.</p>
  </div>
`,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Failed to send verification email:", result);
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return { success: false, error: err };
  }
}

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
      It expires in 15 minutes
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

    return { success: true, data: result };
  } catch (err) {
    console.log(err);
    return { success: false, error: err };
  }
}

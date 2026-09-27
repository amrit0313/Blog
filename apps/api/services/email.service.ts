import { Resend } from "resend";
import { getEnvConfig } from "../config/env.config";

const { RESEND_API_KEY } = getEnvConfig();
// Initialize Resend with your API key
const resend = new Resend(RESEND_API_KEY);

// Export a reusable function
export async function sendResetMail(
  userEmail: string,
  name: string,
  token: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: userEmail,
      subject: `Welcome to our app, ${name}!`,
      html: `
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
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    // console.error("Unexpected error:", err);
    return { success: false, error: err };
  }
}

import "dotenv/config";

export const getEnvConfig = () => {
  const port = Number(process.env.PORT) || 5000;
  const mongoUri = process.env.MONGO_URI;
  const JWT_SECRET = process.env.JWT_SECRET;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!RESEND_API_KEY) {
    throw new Error("RESEND API KEY is not defined");
  }

  return {
    port,
    mongoUri,
    JWT_SECRET,
    RESEND_API_KEY,
  };
};

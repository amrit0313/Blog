import "dotenv/config";

export const getEnvConfig = () => {
  const port = Number(process.env.PORT) || 5000;
  const mongoUri = process.env.MONGO_URI;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return {
    port,
    mongoUri,
    JWT_SECRET,
  };
};

import dotenv from "dotenv";
dotenv.config();

export const getEnvConfig = () => {
  const MODE = process.env.NODE_ENV ?? "development";
  const JWT_SECRET = process.env.JWT_SECRET;

  return {
    MODE,
    JWT_SECRET,
  };
};

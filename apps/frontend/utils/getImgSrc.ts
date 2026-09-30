const API_URL = process.env.NEXT_PUBLIC_API_FUNCTION;

export const imgSrc = (img?: { url?: string } | string, folder = "blogs") =>
  !img
    ? undefined
    : typeof img === "string"
      ? `${API_URL}/uploads/${folder}/${img}` // legacy
      : img.url;

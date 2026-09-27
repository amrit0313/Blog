import { FaCircleUser } from "react-icons/fa6";

interface AvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  fallback?: "initials" | "icon";
}

function getAvatarUrl(src?: string | null) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  return `${apiUrl.replace(/\/api\/?$/, "")}/uploads/profiles/${src}`;
}

export default function Avatar({
  src,
  name,
  className = "h-20 w-20",
  fallback = "initials",
}: AvatarProps) {
  const avatarUrl = getAvatarUrl(src);
  const label = name ? `${name} avatar` : "Profile avatar";

  if (avatarUrl) {
    return (
      <span
        className={`block shrink-0 rounded-full border bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${avatarUrl})` }}
        role="img"
        aria-label={label}
      />
    );
  }

  if (fallback === "icon") {
    return <FaCircleUser className={className} aria-label={label} />;
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground ${className}`}
      aria-label={label}
    >
      {name?.charAt(0).toUpperCase() ?? "?"}
    </span>
  );
}

import { FaCircleUser } from "react-icons/fa6";
import { imgSrc, type ImageReference } from "../utils/getImgSrc";

interface AvatarProps {
  src?: ImageReference | string | null;
  name?: string;
  className?: string;
  fallback?: "initials" | "icon";
}

export default function Avatar({
  src,
  name,
  className = "h-20 w-20",
  fallback = "initials",
}: AvatarProps) {
  const avatarUrl = src && imgSrc(src, "profile");
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

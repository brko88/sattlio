const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

export function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(a?: string, b?: string) {
  return `${a?.[0] ?? ""}${b?.[0] ?? ""}`.toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number;
  className?: string;
}

function Avatar({ src, firstName = "", lastName = "", size = 44, className = "" }: AvatarProps) {
  const dim = `${size}px`;
  const alt = `${firstName} ${lastName}`.trim();

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{ width: dim, height: dim }}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: dim, height: dim, fontSize: size * 0.4 }}
      className={`rounded-full ${colorForName(`${firstName}${lastName}`)} text-white flex items-center justify-center font-semibold shrink-0 ${className}`}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

export default Avatar;

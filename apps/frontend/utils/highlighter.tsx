type Props = { text?: string; query?: string };

export default function Highlight({ text = "", query = "" }: Props) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "i"));

  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-foreground">
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  );
}
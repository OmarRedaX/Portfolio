export function SectionHeading({
  eyebrow,
  title,
  id,
}: {
  eyebrow: string;
  title: string;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="tag">{eyebrow}</span>
      <h2 id={id} className="font-display text-h2">
        {title}
      </h2>
    </div>
  );
}

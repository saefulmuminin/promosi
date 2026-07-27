/** Ikon Material Symbols. `name` = nama ikon (mis. "home", "payments"). */
export function MIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

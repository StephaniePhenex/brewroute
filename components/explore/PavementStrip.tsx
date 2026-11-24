export function PavementStrip() {
  return (
    <div
      aria-hidden="true"
      className="h-10 bg-pave"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, transparent 0 95px, rgba(59,38,33,0.09) 95px 96px)",
      }}
    />
  );
}

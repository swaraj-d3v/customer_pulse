export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="panel flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <div className="animate-shimmer relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        </div>
        <p className="mt-4 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

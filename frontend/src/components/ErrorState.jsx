export default function ErrorState({ message }) {
  return (
    <div className="panel border-danger/25 bg-danger/5 p-6">
      <p className="text-sm font-medium text-danger">Data unavailable</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}

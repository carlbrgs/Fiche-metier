export function Loader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      {message}
    </div>
  );
}

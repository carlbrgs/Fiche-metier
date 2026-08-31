export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="erreur" role="alert">
      <strong>Erreur</strong>
      <p>{message}</p>
    </div>
  );
}

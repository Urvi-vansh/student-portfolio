function ErrorMessage({ message }) {
  return (
    <div className="error-message" role="alert">
      <p>Unable to load repositories.</p>
      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;

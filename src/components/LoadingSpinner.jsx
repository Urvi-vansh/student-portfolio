function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" aria-hidden="true" />
      <span>Loading GitHub repositories...</span>
    </div>
  );
}

export default LoadingSpinner;

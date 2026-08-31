export default function AppLoading() {
  return <div className="route-skeleton" aria-busy="true" aria-label="Loading page">
    <div className="skeleton-line skeleton-title" />
    <div className="skeleton-line skeleton-subtitle" />
    <div className="skeleton-toolbar" />
    <div className="skeleton-grid">
      {Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-copy"><span /><span /></div></div>)}
    </div>
  </div>;
}

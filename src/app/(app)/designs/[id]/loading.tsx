export default function DesignDestinationLoading() {
  return (
    <div className="route-skeleton detail-route-skeleton" aria-busy="true" aria-label="Loading design">
      <div className="skeleton-line skeleton-back-link" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="detail-skeleton-grid">
        <div className="skeleton-card detail-skeleton-primary">
          <div className="skeleton-detail-image" />
          <div className="skeleton-copy detail-skeleton-copy"><span /><span /><span /></div>
        </div>
        <div className="skeleton-card detail-skeleton-secondary">
          <div className="skeleton-copy detail-skeleton-copy"><span /><span /><span /><span /></div>
        </div>
      </div>
    </div>
  );
}

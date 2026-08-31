"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="empty-state full-page"><h1>Something went wrong</h1><p>The request could not be completed. Please try again.</p><button className="button primary" onClick={reset}>Try again</button></div>;
}

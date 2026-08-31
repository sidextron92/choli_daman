import Link from "next/link";

export default function NotFound() {
  return <div className="empty-state full-page"><h1>Not found</h1><p>That workshop record does not exist.</p><Link className="button primary" href="/">Return home</Link></div>;
}

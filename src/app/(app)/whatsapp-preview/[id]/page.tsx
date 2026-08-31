import { permanentRedirect } from "next/navigation";

export default async function LegacyWhatsAppPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(`/designs/${id}/share`);
}

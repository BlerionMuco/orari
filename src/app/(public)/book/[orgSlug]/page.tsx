type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicBookingPage({ params }: Props) {
  const { orgSlug } = await params;
  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-text">Book with {orgSlug}</h1>
      <p className="mt-2 text-text-muted">Booking wizard mounts here.</p>
    </main>
  );
}

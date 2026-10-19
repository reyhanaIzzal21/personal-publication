interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPublicationPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="max-w-[580px] w-full mx-auto px-4 sm:px-6 py-12">
      <p className="text-secondary text-sm">Edit publication placeholder: {id}</p>
    </main>
  );
}

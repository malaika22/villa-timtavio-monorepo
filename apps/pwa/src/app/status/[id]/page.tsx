import { PageLayout } from '@/components/AppLayout/PageLayout';
import { RequestDetailView } from '@/components/Status/RequestDetailView';

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { id } = await params;

  return (
    <PageLayout>
      <RequestDetailView id={id} open={true} onClose={() => {}} />
    </PageLayout>
  );
}

import { VendorDetailPage } from '@/components/manager/pages/vendors/VendorDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorDetailPage id={id} />;
}

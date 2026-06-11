import { InquiryDetailPage } from '@/components/manager/pages/inquiries/InquiryDetailPage';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InquiryDetailPage id={id} />;
}

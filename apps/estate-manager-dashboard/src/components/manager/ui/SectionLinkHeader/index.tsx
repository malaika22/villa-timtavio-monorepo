import Link from 'next/link';

export const SectionLinkHeader = ({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <h3 className="font-cormorant text-xl leading-tight font-normal text-manager-text">
      {title}
    </h3>
    <Link
      href={href}
      className="shrink-0 text-sm font-medium text-[#7a4f45] transition-colors hover:text-manager-accent hover:underline"
    >
      {linkLabel}
    </Link>
  </div>
);

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
  // `flex-1` grows the content to fill the flex column in AppLayout's <main>,
  // so the paper background reaches the bottom even on short screens (no white
  // band) — without over-extending the way min-h-[100dvh] would under the
  // header/footer.
  return (
    <div className="flex-1 bg-timtavio-background px-3 py-4">{children}</div>
  );
};

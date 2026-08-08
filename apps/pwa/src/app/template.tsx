/**
 * A template rather than a layout, because a template remounts on every
 * navigation — which is exactly what gives us something to fade.
 *
 * Four tabs that hard-cut feel like four applications; the same four with a
 * short fade feel like one. It costs nothing and it's the difference a guest
 * attributes to quality without being able to name it.
 */
export default function RouteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-route-in flex flex-1 flex-col">{children}</div>;
}

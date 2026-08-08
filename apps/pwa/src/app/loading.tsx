import { RouteLoading } from '@/components/Loading/RouteLoading';

/**
 * Route-level loading. Deliberately NOT the branded black screen — that one
 * says "authenticating your stay", which is a lie on a tab change and covers
 * the header and footer while it tells it.
 */
export default function AppLoading() {
  return <RouteLoading />;
}

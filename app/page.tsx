import { ExploreView } from "@/components/explore/ExploreView";
import { MOCK_EXPLORE_DATA, MOCK_EXPLORER } from "@/lib/mocks/explore";

interface ExplorePageProps {
  searchParams: Promise<{ demo?: string | string[] }>;
}

// Sprint 1 renders entirely from mocks. `?demo=signed-out` previews the
// signed-out state until Auth.js / Clerk lands (Issue 2).
export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { demo } = await searchParams;
  const session = demo === "signed-out" ? null : MOCK_EXPLORER;
  return <ExploreView data={MOCK_EXPLORE_DATA} session={session} />;
}

// Sprint 1 mock data for the EXPLORE view. No Supabase — see docs/SPRINTS.md Issue 6.
//
// Fixture facts the tests rely on:
// - 7 cafés, `cafe-marigold` soft-deleted → 6 live stops.
// - `quiet` AND `wifi` → Paper Lantern + Little Atlas only.
// - `cafe-gilded-kettle` has zero reviews ("No ratings yet").
// - The mock explorer reviewed Paper Lantern twice, Fern & Filter once, and the
//   retired Marigold once → 2 unique live stamps (2/6 STAMPS, 2 / 3 raffle).

import type {
  Cafe,
  ExploreData,
  ExplorerSession,
  Review,
  Season,
} from "@/lib/types/explore";

export const MOCK_SEASON: Season = {
  id: "season-autumn-2026",
  name: "Autumn Pour-Over Crawl",
  theme: "Slow mornings, fruity filters, and quiet corners",
  status: "ACTIVE",
  minCheckins: 3,
  winnerCount: 2,
};

const SEASON = MOCK_SEASON.id;

export const MOCK_CAFES: Cafe[] = [
  {
    id: "cafe-paper-lantern",
    seasonId: SEASON,
    name: "Paper Lantern Coffee",
    address: "2512 Main St, Vancouver, BC",
    latitude: 49.2633,
    longitude: -123.1007,
    tags: ["quiet", "wifi", "pour-over"],
    sortOrder: 1,
    deletedAt: null,
  },
  {
    id: "cafe-rosehip",
    seasonId: SEASON,
    name: "Rosehip Espresso Bar",
    address: "12 Water St, Vancouver, BC",
    latitude: 49.284,
    longitude: -123.109,
    tags: ["pastry", "jazz"],
    sortOrder: 2,
    deletedAt: null,
  },
  {
    id: "cafe-fern-filter",
    seasonId: SEASON,
    name: "Fern & Filter",
    address: "180 E 7th Ave, Vancouver, BC",
    latitude: 49.262,
    longitude: -123.099,
    tags: ["quiet", "fruity", "pour-over"],
    sortOrder: 3,
    deletedAt: null,
  },
  {
    id: "cafe-ochre-hour",
    seasonId: SEASON,
    name: "Ochre Hour",
    address: "233 Keefer St, Vancouver, BC",
    latitude: 49.2795,
    longitude: -123.1,
    tags: ["jazz", "wifi"],
    sortOrder: 4,
    deletedAt: null,
  },
  {
    id: "cafe-little-atlas",
    seasonId: SEASON,
    name: "Little Atlas Roasters",
    address: "1488 W Broadway, Vancouver, BC",
    latitude: 49.263,
    longitude: -123.115,
    tags: ["quiet", "wifi", "pastry"],
    sortOrder: 5,
    deletedAt: null,
  },
  {
    id: "cafe-gilded-kettle",
    seasonId: SEASON,
    name: "The Gilded Kettle",
    address: "860 Union St, Vancouver, BC",
    latitude: 49.277,
    longitude: -123.089,
    tags: ["fruity", "pastry"],
    sortOrder: 6,
    deletedAt: null,
  },
  {
    id: "cafe-marigold",
    seasonId: SEASON,
    name: "Marigold Social",
    address: "301 W Cordova St, Vancouver, BC",
    latitude: 49.2838,
    longitude: -123.1112,
    tags: ["jazz"],
    sortOrder: 7,
    deletedAt: "2026-10-30T18:00:00Z",
  },
];

export const MOCK_EXPLORER: ExplorerSession = {
  userId: "u-explorer",
  displayName: "Wren",
  role: "USER",
};

function review(
  id: string,
  userId: string,
  authorName: string,
  cafeId: string,
  scores: [number, number, number],
  note: string,
  createdAt: string
): Review {
  const [coffeeQuality, ambiance, workspaceFriendliness] = scores;
  return {
    id,
    userId,
    authorName,
    cafeId,
    seasonId: SEASON,
    coffeeQuality,
    ambiance,
    workspaceFriendliness,
    note,
    createdAt,
  };
}

export const MOCK_REVIEWS: Review[] = [
  review(
    "r-01",
    "u-explorer",
    "Wren",
    "cafe-paper-lantern",
    [5, 5, 4],
    "Ethiopian Guji pour-over tasted like jasmine and peach. Silent upstairs nook.",
    "2026-10-04T17:12:00Z"
  ),
  review(
    "r-02",
    "u-explorer",
    "Wren",
    "cafe-paper-lantern",
    [4, 5, 5],
    "Second visit for the Kenyan — brighter, blackcurrant finish. Outlets everywhere.",
    "2026-10-19T16:40:00Z"
  ),
  review(
    "r-03",
    "u-explorer",
    "Wren",
    "cafe-fern-filter",
    [5, 4, 3],
    "Natural-process Colombian, strawberry jam sweetness. Ferns on every sill.",
    "2026-10-11T20:05:00Z"
  ),
  review(
    "r-04",
    "u-explorer",
    "Wren",
    "cafe-marigold",
    [3, 4, 2],
    "Lively jazz trio on Sunday, cortado was a touch bitter.",
    "2026-10-02T22:30:00Z"
  ),
  review(
    "r-05",
    "u-mika",
    "Mika",
    "cafe-rosehip",
    [4, 5, 2],
    "Cardamom bun is the move. Vinyl jazz, cramped for laptops.",
    "2026-10-08T18:15:00Z"
  ),
  review(
    "r-06",
    "u-mika",
    "Mika",
    "cafe-ochre-hour",
    [4, 4, 5],
    "Golden-hour light and fast wifi. Washed Honduran, caramel and apple.",
    "2026-10-14T23:50:00Z"
  ),
  review(
    "r-07",
    "u-jules",
    "Jules",
    "cafe-little-atlas",
    [5, 3, 5],
    "House roast on batch brew, milk chocolate and hazelnut. Quiet weekday mornings.",
    "2026-10-21T15:20:00Z"
  ),
  review(
    "r-08",
    "u-jules",
    "Jules",
    "cafe-fern-filter",
    [4, 5, 4],
    "Floral Panama Geisha flight — worth the splurge.",
    "2026-10-24T19:00:00Z"
  ),
  review(
    "r-09",
    "u-jules",
    "Jules",
    "cafe-rosehip",
    [3, 4, 3],
    "Espresso pulled a little short, but the almond croissant redeemed it.",
    "2026-10-27T17:45:00Z"
  ),
];

export const MOCK_EXPLORE_DATA: ExploreData = {
  season: MOCK_SEASON,
  cafes: MOCK_CAFES,
  reviews: MOCK_REVIEWS,
};

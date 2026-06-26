/**
 * One-off: replace the experience catalog with the VTT Experience Catalog CSV.
 * Deletes existing catalog items (and dependent requests/ratings) and inserts
 * the CSV experiences, grouped into EM-managed categories, with themed images.
 *
 * Run: npx tsx prisma/import-experiences.ts
 */
import { PrismaClient, CatalogCategory } from '@prisma/client';

const prisma = new PrismaClient();

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80';

// CSV category → { enum bucket (drives PWA filter), themed image }
const CATEGORY_MAP: Record<
  string,
  { enum: CatalogCategory; image: string }
> = {
  'The Fleet': {
    enum: CatalogCategory.ARRIVAL_TRANSIT,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&q=80',
  },
  'Arrival & The Vibe': {
    enum: CatalogCategory.ARRIVAL_TRANSIT,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
  },
  "Billionaire's Pantry": {
    enum: CatalogCategory.CULINARY_AGAVE,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900&q=80',
  },
  'Reserve Cellar': {
    enum: CatalogCategory.CULINARY_AGAVE,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80',
  },
  'Culinary & Agave': {
    enum: CatalogCategory.CULINARY_AGAVE,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
  },
  'Oaxaca Immersions': {
    enum: CatalogCategory.EXCURSIONS,
    image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=900&q=80',
  },
  'Raw Pacific': {
    enum: CatalogCategory.OCEAN_ADVENTURE,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=80',
  },
  'Vanguard Wellness': {
    enum: CatalogCategory.WELLNESS,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80',
  },
};

const CSV = `Category,Experiene Name,The Pitch,Duration,Price (USD),Vendor
The Fleet,VIP Sprinter Transfer,"Luxury Sprinter van for the entire group, stocked with requested drinks.",Airport Run,,Ola Beach Surf
The Fleet,Full-Day Personal Driver,Dedicated luxury SUV and driver on standby for the group.,12 hrs,,
The Fleet,Daily ATV (4-Wheel) Rental,Premium ATVs staged in the driveway for the duration of the stay.,Daily,,
The Fleet,Daily Scooter (2-Wheel) Rental,High-end scooters for quick trips down to Zicatela or La Punta.,Daily,,
Arrival & The Vibe,The Cinematic Arrival - Mariachi,Full Mariachi band waiting at the gates as the 16-foot doors spin open.,1 hr,,
Arrival & The Vibe,The Cinematic Arrival - Live DJ,Resident DJ spinning deep house as guests are escorted to the pool.,4 hrs,,
Arrival & The Vibe,Private Fire Dancers,Cinematic evening entertainment on the beach or main terrace.,2 hrs,,
Billionaire's Pantry,Japanese Wagyu (A5),"Highest marble-score Wagyu, flown in daily from Mexico City.",Market,Market Price,
Billionaire's Pantry,Beluga & Oscietra Caviar,Premium Caviar service. Flown in daily from Mexico City.,Market,Market Price,
Billionaire's Pantry,Fresh Foie Gras & Kurobuta Pork,"Ultra-premium proteins, flown in daily from Mexico City.",Market,Market Price,
Billionaire's Pantry,King & Stone Crab Claws,Alaskan King & Florida Stone Crab. Flown in daily from Mexico City.,Market,Market Price,
Reserve Cellar,The Champagne Vault,"Louis Roederer Cristal, Salon Blanc de Blancs, Krug Grande Cuvée, Dom Pérignon P2, Armand de Brignac.",Market,Market Price,
Reserve Cellar,The Global Wine Cellar,"A curated list of 10 ultra-premium wines, including top-tier Bordeaux and Burgundies.",Market,Market Price,
Reserve Cellar,The Agave Vault (Tequila & Mezcal),"5 Extra-Añejo Tequilas (e.g., Clase Azul Ultra) & 10 rare, wild-agave small-batch Mezcals.",Market,Market Price,
Reserve Cellar,The Humidor,A curated selection of premium Cuban and Dominican cigars.,Market,Market Price,
Culinary & Agave,The Chef Billy Fly-In,Chef Billy flies in to take over the kitchen for a signature tasting menu.,1 Night,,Villa Crew
Culinary & Agave,Beachfront Private Dining,Full dining room staged directly on the sand.,3 hrs,,Villa Crew
Culinary & Agave,Master Mezcalero Tasting,"A local master brings rare batches for a private, guided pairing and tasting.",2 hrs,,Liliana or Villa Crew
Culinary & Agave,Craft Mixology Lesson,Our lead mixologist teaches the group how to craft high-end agave cocktails.,2 hrs,,Villa Crew
Oaxaca Immersions,30-Hour Oaxaca City Strike Mission,"VIP Sprinter to Centro. Ruins tour, mezcal fields, Brutalist hotel stay, and guided dinner tour.",30 hrs,,
Oaxaca Immersions,The Zipolite Escape (Half-Day),VIP transport to Mexico's famous bohemian beach. Reserved daybeds and sunset cocktails.,6 hrs,,
Oaxaca Immersions,Architecture & Art Circuit,"VIP access to Casa Wabi, lunch at Hotel Escondido, dinner at Kakurega Omakase.",8 hrs,,
Raw Pacific,The Mega-Yacht Party,"Fully staffed luxury yacht charter with open bar, DJ, and catering.",4-6 hrs,,
Raw Pacific,Deep Sea Sportfishing,"Private charter targeting marlin, sailfish, and tuna with premium gear.",6 hrs,,
Raw Pacific,VIP Surf Coaching,"Private, pro-level lessons at La Punta",2 hrs,,Ola Beach Club
Raw Pacific,Bioluminescence Night Swim,Guided private excursion to Manialtepec Lagoon for a glowing night swim.,3 hrs,,
Vanguard Wellness,Guided Plant Medicine,Vetted shaman-led psilocybin (mushroom) ceremony for profound somatic healing.,4-6 hrs,,
Vanguard Wellness,Deep Tissue & Swedish Massage,High-end customized massage therapy in the privacy of the suite.,90 Min,,Hikaru Massage
Vanguard Wellness,Twilight Sound Bath,Holistic healing frequency session led by a master practitioner.,2 hrs,,
Vanguard Wellness,Poolside Night Therapy,Guided sensory deprivation or watsu water-therapy in the estate pool at night.,2 hrs,,`;

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function durationToMinutes(label: string): number | null {
  const m = label.match(/(\d+)\s*(min|hr|hour)/i);
  if (!m) return null;
  const n = parseInt(m[1]!, 10);
  return /min/i.test(m[2]!) ? n : n * 60;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const lines = CSV.split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rows = lines.slice(1).map(parseLine);

  // 1) Categories (EM-managed filter groups)
  const categoryNames = [...new Set(rows.map((r) => r[0]!.trim()))];
  const categoryIdByName: Record<string, string> = {};
  let sort = 0;
  for (const name of categoryNames) {
    const slug = slugify(name);
    const cat = await prisma.experienceCategory.upsert({
      where: { slug },
      update: { name, isActive: true, sortOrder: sort },
      create: { name, slug, isActive: true, sortOrder: sort },
    });
    categoryIdByName[name] = cat.id;
    sort++;
  }
  console.log(`Categories ready: ${categoryNames.length}`);

  // 2) Wipe existing catalog (+ dependents) so we start clean
  const delRatings = await prisma.vendorRating.deleteMany({});
  const delRequests = await prisma.experienceRequest.deleteMany({});
  const delItems = await prisma.catalogItem.deleteMany({});
  console.log(
    `Deleted: ${delItems.count} experiences, ${delRequests.count} requests, ${delRatings.count} ratings`,
  );

  // 3) Insert CSV experiences
  let created = 0;
  let order = 0;
  for (const r of rows) {
    const [category, name, pitch, duration, price] = r.map((c) => c.trim());
    if (!name) continue;
    const map = CATEGORY_MAP[category!];
    const image = map?.image ?? PLACEHOLDER;
    const isMarket = !price || /market/i.test(price);
    const numericPrice = isMarket ? null : Number(price!.replace(/[^0-9.]/g, ''));

    await prisma.catalogItem.create({
      data: {
        name: name!,
        category: map?.enum ?? CatalogCategory.PRIVATE,
        experienceCategoryId: categoryIdByName[category!],
        description: pitch || name!,
        shortDescription: pitch || undefined,
        isIncluded: false,
        isActive: true,
        durationLabel: duration || undefined,
        durationMinutes: duration ? durationToMinutes(duration) : null,
        basePrice: numericPrice && !Number.isNaN(numericPrice) ? numericPrice : null,
        photoUrls: [image],
        primaryPhotoUrl: image,
        sortOrder: order++,
      },
    });
    created++;
  }
  console.log(`Created ${created} experiences`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

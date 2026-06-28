import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { LocationSchema, type Location } from "@/lib/schemas/business";

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  logoUrl: string | null;
  currency: string;
  location: Location | null;
}

const LocationOrNull = LocationSchema.nullable();

// Profile snapshot for the dashboard form. `location` is re-validated on read
// because the column is jsonb — a future producer could land malformed data,
// and we'd rather drop the value than crash the form.
export async function getBusinessProfile(
  businessId: string,
): Promise<BusinessProfile | null> {
  const [row] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      phone: businesses.phone,
      description: businesses.description,
      logoUrl: businesses.logoUrl,
      currency: businesses.currency,
      location: businesses.location,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!row) return null;
  const locParsed = LocationOrNull.safeParse(row.location);
  return { ...row, location: locParsed.success ? locParsed.data : null };
}

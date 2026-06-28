import { z } from "zod";

// Add-member form. Email is optional — a no-email member is bookable
// immediately (the add_team_member RPC creates only the resource, no invite).
// With an email, the RPC also mints a pending invite so the person can claim
// the resource via /invite/[token] later.
export const TeamMemberFormInput = z.object({
  name: z.string().min(1, "Enter a name.").max(120, "Name is too long."),
  email: z
    .union([z.string().email("Enter a valid email."), z.literal("")])
    .optional(),
});

export type TeamMemberFormInput = z.infer<typeof TeamMemberFormInput>;

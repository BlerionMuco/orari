"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { CopyField } from "@/components/ui/form/copy-field";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { BusinessProfileFormInput } from "@/lib/schemas/business";
import { updateBusinessProfileAction } from "@/lib/businesses/actions";
import { SlugStatus } from "@/lib/schemas/onboarding";
import { useSlugAvailability } from "./use-slug-availability";
import { SlugAvailability } from "./slug-availability";

export interface ProfileFormProps {
  initial: BusinessProfileFormInput;
  publicUrlBase: string; // e.g. "https://orari.app/book"
}

const SLUG_FATAL: ReadonlySet<SlugStatus> = new Set([
  SlugStatus.TAKEN,
  SlugStatus.INVALID,
  SlugStatus.RESERVED,
]);

// Edits the public-facing business profile (name/slug/phone/description/logo
// URL/currency + minimum location). The location sub-fields are kept tight
// (line1, city, countryCode) because the public booking page only renders the
// joined address — extra fields land in a follow-up if operators ask.
export function ProfileForm({
  initial,
  publicUrlBase,
}: ProfileFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BusinessProfileFormInput>({
    resolver: zodResolver(BusinessProfileFormInput),
    defaultValues: initial,
  });

  const liveSlug = watch("slug") ?? "";
  const slugStatus = useSlugAvailability(liveSlug, initial.slug);
  const slugBlocked = SLUG_FATAL.has(slugStatus);

  const onSubmit = handleSubmit((values) => {
    if (slugBlocked) {
      show("Pick an available link first.", ToastVariant.ERROR);
      return;
    }
    startTransition(async () => {
      const res = await updateBusinessProfileAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show("Profile saved");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard title="Basics" contentClassName="flex flex-col gap-4">
        <Field id="bp-name" label="Business name" error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field
          id="bp-slug"
          label="Public link"
          hint={`Customers book at ${publicUrlBase}/${liveSlug || "your-shop"}`}
          error={errors.slug?.message}
        >
          <Input
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            {...register("slug")}
          />
        </Field>
        <SlugAvailability status={slugStatus} />
        <CopyField
          label="Copy public URL"
          value={`${publicUrlBase}/${initial.slug}`}
          ariaLabel="Public booking URL"
        />
      </SectionCard>

      <SectionCard title="Contact" contentClassName="flex flex-col gap-4">
        <Field id="bp-phone" label="Phone" error={errors.phone?.message}>
          <Input type="tel" inputMode="tel" {...register("phone")} />
        </Field>
        <Field
          id="bp-desc"
          label="Description"
          hint="Shown under your shop name on the public page."
          error={errors.description?.message}
        >
          <Textarea rows={3} {...register("description")} />
        </Field>
      </SectionCard>

      <SectionCard title="Branding" contentClassName="flex flex-col gap-4">
        <Field
          id="bp-logo"
          label="Logo URL"
          hint="Paste a Supabase Storage HTTPS URL. File upload is coming soon."
          error={errors.logoUrl?.message}
        >
          <Input
            type="url"
            autoCapitalize="off"
            placeholder="https://<project>.supabase.co/storage/v1/object/public/…"
            {...register("logoUrl")}
          />
        </Field>
        <Field
          id="bp-currency"
          label="Currency"
          hint="ISO 4217 code — drives price formatting."
          error={errors.currency?.message}
        >
          <Input
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={3}
            {...register("currency", {
              setValueAs: (v: unknown) =>
                typeof v === "string" ? v.toUpperCase().trim() : v,
            })}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Location" contentClassName="flex flex-col gap-4">
        <Field
          id="bp-loc-line1"
          label="Street address"
          error={errors.location?.line1?.message}
        >
          <Input {...register("location.line1")} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="bp-loc-city"
            label="City"
            error={errors.location?.city?.message}
          >
            <Input {...register("location.city")} />
          </Field>
          <Field
            id="bp-loc-country"
            label="Country (ISO)"
            hint="2-letter code (AL, IT…)."
            error={errors.location?.countryCode?.message}
          >
            <Input
              autoCapitalize="characters"
              maxLength={2}
              {...register("location.countryCode", {
                setValueAs: (v: unknown) =>
                  typeof v === "string" ? v.toUpperCase().trim() : v,
              })}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="mt-1 flex justify-end">
        <Button type="submit" size="lg" loading={pending} disabled={slugBlocked}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

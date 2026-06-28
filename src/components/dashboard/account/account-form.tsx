"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import {
  UpdateProfileInput,
} from "@/lib/schemas/auth";
import {
  changeEmailAction,
  updateProfileAction,
} from "@/lib/auth/actions";

export interface AccountFormProps {
  initial: {
    fullName: string;
    email: string;
  };
}

// Two related but independent sub-forms in one card stack:
// 1) profile name (writes profiles.full_name immediately)
// 2) email (Supabase sends a confirmation link; the address only flips once
//    the user clicks through, so we show a status hint instead of "saved").
export function AccountForm({ initial }: AccountFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [namePending, startNameTransition] = React.useTransition();
  const [emailPending, startEmailTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInput),
    defaultValues: { fullName: initial.fullName },
  });

  const [email, setEmail] = React.useState(initial.email);

  const onSaveName = handleSubmit((values) => {
    startNameTransition(async () => {
      const res = await updateProfileAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show("Name saved");
      router.refresh();
    });
  });

  const onSendEmailChange = (): void => {
    if (email === initial.email) {
      show("That's already your email.", ToastVariant.INFO);
      return;
    }
    startEmailTransition(async () => {
      const res = await changeEmailAction(email);
      if (!res.ok) {
        show(res.error ?? "Couldn't update email.", ToastVariant.ERROR);
        return;
      }
      show("Check your new inbox to confirm.");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSaveName} noValidate>
        <SectionCard title="Your profile" contentClassName="flex flex-col gap-4">
          <Field
            id="acc-name"
            label="Full name"
            error={errors.fullName?.message}
          >
            <Input {...register("fullName")} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={namePending}>
              Save name
            </Button>
          </div>
        </SectionCard>
      </form>

      <SectionCard title="Email" contentClassName="flex flex-col gap-4">
        <Field
          id="acc-email"
          label="Email address"
          hint="We'll send a confirmation link to the new address."
        >
          <Input
            type="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSendEmailChange}
            loading={emailPending}
          >
            Send confirmation
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

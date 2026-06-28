"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/overlay/sheet";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { TeamMemberFormInput } from "@/lib/schemas/team";
import { inviteTeamMemberAction } from "@/lib/team/actions";

// Opens a sheet (bottom on mobile, right drawer on desktop) with a name +
// optional email form. Email triggers the invite path in add_team_member;
// no-email creates a bookable resource without a login.
export function InviteForm(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const show = useToast((s) => s.show);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamMemberFormInput>({
    resolver: zodResolver(TeamMemberFormInput),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res = await inviteTeamMemberAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't add.", ToastVariant.ERROR);
        return;
      }
      if (res.invitePath) {
        await copyInviteLink(res.invitePath, show);
      } else {
        show("Team member added");
      }
      reset({ name: "", email: "" });
      setOpen(false);
    });
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add
      </Button>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add team member</SheetTitle>
          <SheetDescription>
            Email is optional. Without one, the person is bookable but can&apos;t log in.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field id="invite-name" label="Name" error={errors.name?.message}>
            <Input placeholder="e.g. Erion Hoxha" {...register("name")} />
          </Field>
          <Field
            id="invite-email"
            label="Email"
            hint="Used to send a sign-in link."
            error={errors.email?.message}
          >
            <Input
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              {...register("email")}
            />
          </Field>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// V1 has no email pipeline yet, so the operator copies the invite URL and
// hands it over manually. Falls back to a toast with the URL if clipboard
// access is denied (older Safari, insecure context, locked-down browser).
async function copyInviteLink(
  invitePath: string,
  show: (msg: string, variant?: ToastVariant) => void,
): Promise<void> {
  const url = `${window.location.origin}${invitePath}`;
  try {
    await navigator.clipboard.writeText(url);
    show("Invite link copied to clipboard");
  } catch {
    show(`Invite link: ${url}`, ToastVariant.INFO);
  }
}

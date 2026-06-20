"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import type { CreateBookingActionResult } from "@/app/(public)/book/actions";
import { QUERY_KEYS } from "@/lib/query/keys";
import { createBooking } from "./api";
import type { UseCreateBookingArgs } from "./types";

// Write hook for creating a booking. No optimistic cache update (there's no
// client-side list to mutate — a booked or just-taken slot disappears, which the
// onSettled invalidate refetches). onSuccess/onError forward to the caller (the
// wizard wires the store + UI). The optimistic → rollback → invalidate template
// is documented in docs/v1/react-query.md for the first list mutation (cancel /
// dashboard) that needs it.
export function useCreateBooking(
  args: UseCreateBookingArgs = {},
): UseMutationResult<CreateBookingActionResult, Error, CreateBookingInput> {
  const queryClient = useQueryClient();

  return useMutation<CreateBookingActionResult, Error, CreateBookingInput>({
    mutationFn: (input) => createBooking(input),
    onSuccess: (result) => args.onSuccess?.(result),
    onError: (error) => args.onError?.(error),
    // A successful booking (or one taken under us) changes availability — refetch.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.AVAILABILITY],
      });
    },
  });
}

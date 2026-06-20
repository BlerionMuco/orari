// Public surface of the booking data layer. Components import hooks from here;
// they never call the route or server actions directly.
export {
  useAvailability,
  availabilityQueryOptions,
} from "./use-availability";
export { useCreateBooking } from "./use-create-booking";
export { fetchAvailability, createBooking } from "./api";
export type { FetchAvailabilityParams } from "./api";
export type {
  AvailabilityDay,
  AvailabilityParams,
  UseAvailabilityResult,
  UseCreateBookingArgs,
} from "./types";

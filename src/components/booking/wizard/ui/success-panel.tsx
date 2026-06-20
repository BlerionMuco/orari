"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { ReviewSummary, type SummaryRow } from "./review-summary";

export interface SuccessPanelProps {
  businessName: string;
  confirmationCode: string;
  rows: SummaryRow[];
  directionsHref: string | null;
  icsHref: string;
  onBookAnother: () => void;
}

export function SuccessPanel({
  businessName,
  confirmationCode,
  rows,
  directionsHref,
  icsHref,
  onBookAnother,
}: SuccessPanelProps): React.JSX.Element {
  const reduce = useReducedMotion();
  const draw = (delay: number) =>
    reduce
      ? undefined
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { duration: 0.5, delay, ease: [0.65, 0, 0.35, 1] as const },
        };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-130 text-center lg:rounded-[20px] lg:border lg:border-border lg:bg-surface lg:p-9 lg:shadow-card">
        <motion.div
          initial={reduce ? false : { scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 16 }}
          className="mx-auto mb-5.5 flex h-22 w-22 items-center justify-center rounded-full bg-success-bg"
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="text-success">
            <motion.circle
              cx="26"
              cy="26"
              r="23"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              {...draw(0)}
            />
            <motion.path
              d="M16 26.5l7 7L37 19"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              {...draw(0.46)}
            />
          </svg>
        </motion.div>

        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-text">
          You&apos;re booked
        </h2>
        <p className="mx-auto mt-1.5 max-w-80 text-[14px] leading-[1.5] text-text-muted">
          See you soon at {businessName}. No need to pay online — settle up in
          person.
        </p>
        <span className="mb-6 mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-2.75 py-1.25 text-[12px] font-medium text-primary">
          Confirmation {confirmationCode}
        </span>

        <ReviewSummary rows={rows} tone="subtle" className="text-left" />

        <div className="mt-4.5 flex gap-2.5">
          {directionsHref ? (
            <Button
              asChild
              size="lg"
              className="flex-1 shadow-[0_8px_20px_-8px_rgba(91,95,199,0.5)]"
            >
              <a href={directionsHref} target="_blank" rel="noreferrer noopener">
                <MapPin className="h-4.5 w-4.5" strokeWidth={2} />
                Get directions
              </a>
            </Button>
          ) : null}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-13.5 flex-none px-0 text-primary"
          >
            <a href={icsHref} download="orari-booking.ics" aria-label="Add to calendar">
              <CalendarPlus className="h-4.75 w-4.75" strokeWidth={1.9} />
            </a>
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onBookAnother}
          className="mt-4.5 text-[13.5px] text-text-muted"
        >
          Book another appointment
        </Button>
      </div>
    </div>
  );
}

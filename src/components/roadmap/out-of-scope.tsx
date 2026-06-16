import * as React from "react";

export function OutOfScope({
  items,
}: {
  items: string[];
}): React.JSX.Element {
  return (
    <section className="rounded-2xl border border-border border-dashed bg-bg p-5 sm:p-6">
      <h2 className="text-[17px] font-semibold tracking-tight text-text">
        Out of scope for V1
      </h2>
      <p className="mt-1 text-[13px] text-text-muted">
        Correct eventually — none earns its place until one real shop runs on the
        spine.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[13px] text-text-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

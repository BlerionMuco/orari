# Color system

The complete color palette for the booking platform. Built on five core values — a warm
off-white surface, a warm-gray neutral scale, near-black text, and an indigo accent — with
supporting shades derived to cover every interface state (hover, pressed, disabled, surfaces,
and alerts).

Two rules hold everything together:

1. **Focus rings** are always the brand indigo at ~20% opacity: `rgba(91, 95, 199, 0.2)`.
2. **Text on a colored fill** uses that color family's dedicated text shade — never plain
   black or generic gray.

---

## Neutrals

A warm-gray scale, light to dark.

| Token            | Hex       | Use                                              |
| ---------------- | --------- | ------------------------------------------------ |
| `surface`        | `#FFFFFF` | Cards, inputs, raised panels                     |
| `bg`             | `#FAFAF9` | Page background                                  |
| `fill-subtle`    | `#F1EFE8` | Hover rows, segmented-control track, skeletons   |
| `border`         | `#E7E5E1` | Default borders and dividers                     |
| `border-strong`  | `#D3D1C7` | Hover / emphasis borders                         |
| `text-disabled`  | `#B4B2A9` | Placeholder and disabled text                    |
| `text-muted`     | `#6B6B63` | Secondary text, field labels                     |
| `text`           | `#1A1A17` | Primary text and headings                        |

---

## Brand — indigo

The single accent that carries the product's personality.

| Token                | Hex       | Use                                                       |
| -------------------- | --------- | --------------------------------------------------------- |
| `primary-tint`       | `#ECEDFB` | Selected-slot background, badge background, subtle button |
| `primary-tint-hover` | `#DADBF7` | Hover on tinted elements                                  |
| `primary`            | `#5B5FC7` | Primary buttons, active nav, focus ring                   |
| `primary-hover`      | `#4A4EB5` | Primary button hover                                      |
| `primary-pressed`    | `#3D3F94` | Pressed state, and text on a tinted background            |

---

## Semantic

Each status has three values: a `base` (icons, dots, solid fills), a `bg` (badge / alert
background), and a `text` (the readable shade on that background). `info` deliberately reuses
the brand indigo so informational states don't introduce a second blue.

| Status    | Base      | Background | Text      |
| --------- | --------- | ---------- | --------- |
| `success` | `#1D9E75` | `#E1F5EE`  | `#0F6E56` |
| `warning` | `#EF9F27` | `#FAEEDA`  | `#854F0B` |
| `danger`  | `#E24B4A` | `#FCEBEB`  | `#A32D2D` |
| `info`    | `#5B5FC7` | `#ECEDFB`  | `#3D3F94` |

---

## CSS custom properties

```css
:root {
  /* Neutrals */
  --surface: #FFFFFF;
  --bg: #FAFAF9;
  --fill-subtle: #F1EFE8;
  --border: #E7E5E1;
  --border-strong: #D3D1C7;
  --text-disabled: #B4B2A9;
  --text-muted: #6B6B63;
  --text: #1A1A17;

  /* Brand — indigo */
  --primary-tint: #ECEDFB;
  --primary-tint-hover: #DADBF7;
  --primary: #5B5FC7;
  --primary-hover: #4A4EB5;
  --primary-pressed: #3D3F94;
  --focus-ring: rgba(91, 95, 199, 0.2);

  /* Semantic */
  --success: #1D9E75;
  --success-bg: #E1F5EE;
  --success-text: #0F6E56;

  --warning: #EF9F27;
  --warning-bg: #FAEEDA;
  --warning-text: #854F0B;

  --danger: #E24B4A;
  --danger-bg: #FCEBEB;
  --danger-text: #A32D2D;

  --info: #5B5FC7;
  --info-bg: #ECEDFB;
  --info-text: #3D3F94;
}
```

---

## Tailwind config

Drop into `tailwind.config.js` under `theme.extend.colors`.

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF",
        bg: "#FAFAF9",
        "fill-subtle": "#F1EFE8",
        border: "#E7E5E1",
        "border-strong": "#D3D1C7",
        text: {
          DEFAULT: "#1A1A17",
          muted: "#6B6B63",
          disabled: "#B4B2A9",
        },
        primary: {
          DEFAULT: "#5B5FC7",
          hover: "#4A4EB5",
          pressed: "#3D3F94",
          tint: "#ECEDFB",
          "tint-hover": "#DADBF7",
        },
        success: { DEFAULT: "#1D9E75", bg: "#E1F5EE", text: "#0F6E56" },
        warning: { DEFAULT: "#EF9F27", bg: "#FAEEDA", text: "#854F0B" },
        danger:  { DEFAULT: "#E24B4A", bg: "#FCEBEB", text: "#A32D2D" },
        info:    { DEFAULT: "#5B5FC7", bg: "#ECEDFB", text: "#3D3F94" },
      },
      ringColor: {
        focus: "rgba(91, 95, 199, 0.2)",
      },
    },
  },
};
```

---

## Component mapping

How the tokens land on common components.

| Component              | Background          | Border               | Text                  |
| ---------------------- | ------------------- | -------------------- | --------------------- |
| Primary button         | `primary`           | —                    | `#FFFFFF`             |
| Primary button (hover)  | `primary-hover`     | —                    | `#FFFFFF`             |
| Secondary button        | `primary-tint`      | —                    | `primary-pressed`     |
| Outline button          | `surface`           | `border`             | `text`                |
| Danger button           | `surface`           | `danger`             | `danger-text`         |
| Input                   | `surface`           | `border`             | `text`                |
| Input (focus)           | `surface`           | `primary` + ring     | `text`                |
| Input (error)           | `surface`           | `danger`             | `text`                |
| Input (disabled)        | `fill-subtle`       | `border`             | `text-disabled`       |
| Card                    | `surface`           | `border`             | `text`                |
| Active nav item         | `primary-tint`      | `primary` (left bar) | `primary-pressed`     |
| Selected slot           | `primary`           | `primary`            | `#FFFFFF`             |
| Confirmed badge         | `success-bg`        | —                    | `success-text`        |
| Pending badge           | `warning-bg`        | —                    | `warning-text`        |
| Cancelled badge         | `danger-bg`         | —                    | `danger-text`         |

---

## Accessibility notes

- `text` on `bg` and on `surface` clears WCAG AAA for body text.
- `text-muted` on `surface` clears AA for body text — keep it for secondary content, not for
  the smallest type on the lightest backgrounds.
- White text on `primary`, `success`, and `danger` clears AA. On `warning` (`#EF9F27`) use
  the dark `warning-text` shade instead of white — amber is too light for white text.
- Never signal state with color alone. Pair each status color with an icon or a label
  (a dot, a checkmark, the word "Pending") so it reads without color perception.

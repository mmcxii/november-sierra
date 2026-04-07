import type { ThemeVariables } from "@/lib/custom-themes";

type VariableSection = {
  fields: { gradient?: boolean; key: keyof ThemeVariables; label: string }[];
  title: string;
};

export const SECTIONS: VariableSection[] = [
  {
    fields: [
      { key: "anchor-color", label: "Anchor color" },
      { gradient: true, key: "glow-bg", label: "Glow" },
      { key: "hairline", label: "Hairline" },
    ],
    title: "Page",
  },
  {
    fields: [
      { gradient: true, key: "card-bg", label: "Background" },
      { key: "border", label: "Border" },
      { key: "divider", label: "Divider" },
    ],
    title: "Card",
  },
  {
    fields: [{ key: "brand", label: "Brand" }],
    title: "Accent",
  },
  {
    fields: [
      { key: "avatar-bg", label: "Background" },
      { key: "avatar-inner-border", label: "Inner border" },
      { key: "avatar-outer-ring", label: "Outer ring" },
    ],
    title: "Avatar",
  },
  {
    fields: [
      { key: "featured-bg", label: "Background" },
      { key: "featured-border", label: "Border" },
      { key: "featured-icon-bg", label: "Icon bg" },
      { key: "featured-icon-color", label: "Icon color" },
      { key: "featured-text", label: "Text" },
    ],
    title: "Featured",
  },
  {
    fields: [
      { key: "link-bg", label: "Background" },
      { key: "link-border", label: "Border" },
      { key: "link-icon-bg", label: "Icon bg" },
      { key: "link-icon-color", label: "Icon color" },
      { key: "link-text", label: "Text" },
    ],
    title: "Link icons",
  },
  {
    fields: [{ key: "name-color", label: "Name color" }],
    title: "Display name",
  },
];

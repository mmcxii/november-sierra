export const TOP_LINKS = [
  { clicks: 847, label: "Master Video Editing" },
  { clicks: 612, label: "YouTube Channel" },
  { clicks: 341, label: "Book a Call" },
];

// Catmull-Rom → cubic bezier (α=1/6). Every data point sits exactly on the curve.
export const CHART_LINE = [
  "M 0 29.76",
  "C 7.78 28.40, 31.11 24.32, 46.67 21.6",
  "C 62.23 18.88, 77.77 13.84, 93.33 13.44",
  "C 108.89 13.04, 124.44 21.44, 140 19.2",
  "C 155.56 16.96, 171.11 1.92, 186.67 0",
  "C 202.23 0, 217.77 3.36, 233.33 7.68",
  "C 248.89 12.0, 272.22 22.88, 280 25.92",
].join(" ");

export const CHART_AREA = `${CHART_LINE} L 280 48 L 0 48 Z`;
export const DAYS = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
  { id: "sun", label: "S" },
];
export const PEAK_IDX = 4;

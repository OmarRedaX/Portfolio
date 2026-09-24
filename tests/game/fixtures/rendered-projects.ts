import type { GeometrySnapshot, Rect, SectionId } from "../../../lib/game/model";

// Chromium, 1440 × 900 after Projects → wheel to scrollY=3816.8 (2026-09-22).
// DOM base rectangles, with visible project reveals settled; no synthetic route.
export function settledProjects(): GeometrySnapshot {
  const box = (x: number, y: number, width: number, height: number): Rect => ({
    x,
    y,
    width,
    height,
  });
  const snapshot: GeometrySnapshot = {
    surfaces: [],
    plannedSurfaces: [],
    targets: [],
    plannedTargets: [],
    elements: new Map(),
    sectionBounds: {
      hero: box(0, 123, 1424.800048828125, 827),
      about: box(0, 950, 1424.800048828125, 886),
      "tech-stack": box(0, 1836, 1424.800048828125, 1296.5999755859375),
      projects: box(0, 3132.6000366210938, 1424.800048828125, 1628.5999755859375),
      experience: box(0, 4761.2000732421875, 1424.800048828125, 790.7999877929688),
      contact: box(0, 5552.0001220703125, 1424.800048828125, 729.4000244140625),
    },
    sectionAnchors: {
      hero: box(184.40000915527344, 644.949951171875, 1056, 67.20000457763672),
      about: box(184.40000915527344, 1078, 1056, 71.5999984741211),
      "tech-stack": box(184.40000915527344, 1964.800048828125, 1056, 71.5999984741211),
      projects: box(184.40000915527344, 3261.4000244140625, 1056, 71.5999984741211),
      experience: box(184.40000915527344, 4890.0001220703125, 1056, 71.5999984741211),
      contact: box(
        184.40000915527344,
        5776.4000244140625,
        458.1750183105469,
        129.60000610351562,
      ),
    },
    obstacles: [
      box(184.40000915527344, 360.03759765625, 209.3000030517578, 18.200000762939453),
      box(184.40000915527344, 402.237548828125, 896, 90.7125015258789),
      box(184.40000915527344, 516.949951171875, 672, 28.80000114440918),
      box(184.40000915527344, 569.75, 672, 51.20000076293945),
      box(184.40000915527344, 1189.60009765625, 768, 364.8000183105469),
      box(210, 5001.60009765625, 1030.4000244140625, 191.1999969482422),
      box(210, 5232.800048828125, 1030.4000244140625, 191.1999969482422),
      box(690.5750122070312, 5680.800048828125, 549.8125, 472.6000061035156),
    ],
    keepouts: [],
    actionRows: [],
    plannedActionRows: [],
    headerBottom: 84,
    revealsSettled: true,
  };
  const rows: Array<[string, SectionId, number, number, number, number]> = [
    [
      "hero-actions",
      "hero",
      184.40000915527344,
      644.949951171875,
      1056,
      67.20000457763672,
    ],
    [
      "project-quick-bite-actions",
      "projects",
      225.1999969482422,
      4065.600051879883,
      974.4000244140624,
      57.60000228881836,
    ],
    [
      "project-social-media-actions",
      "projects",
      217.1999969482422,
      4515.000061035156,
      446.3999938964844,
      33.60000228881836,
    ],
    [
      "project-fresh-cart-actions",
      "projects",
      761.2000122070312,
      4566.800048828125,
      446.3999938964844,
      33.60000228881836,
    ],
    [
      "contact-actions",
      "contact",
      184.40000915527344,
      5776.4000244140625,
      458.1750183105469,
      129.60000610351562,
    ],
  ];
  snapshot.plannedActionRows = rows.map(([id, section, x, y, width, height]) => ({
    id,
    section,
    rect: box(x, y, width, height),
  }));
  snapshot.actionRows = snapshot.plannedActionRows.filter(
    (row) => row.section !== "contact",
  );
  const links: Array<[string, number, number, number, number, boolean]> = [
    [
      "hero-projects",
      184.40000915527344,
      660.949951171875,
      122.3625030517578,
      51.20000076293945,
      true,
    ],
    [
      "hero-resume",
      322.76251220703125,
      660.949951171875,
      109.5250015258789,
      51.20000076293945,
      true,
    ],
    [
      "hero-contact",
      448.2875061035156,
      660.949951171875,
      105.9124984741211,
      51.20000076293945,
      true,
    ],
    [
      "quick-bite-core",
      225.1999969482422,
      4073.600067138672,
      109.625,
      49.60000228881836,
      true,
    ],
    [
      "quick-bite-order",
      350.82501220703125,
      4073.600067138672,
      115.5250015258789,
      49.60000228881836,
      true,
    ],
    [
      "quick-bite-analytics",
      482.3500061035156,
      4073.600067138672,
      140.0500030517578,
      49.60000228881836,
      true,
    ],
    [
      "quick-bite-overview",
      638.4000244140625,
      4073.600067138672,
      84.6875,
      49.60000228881836,
      true,
    ],
    [
      "quick-bite-caseStudy",
      739.0875244140625,
      4073.600067138672,
      130.3000030517578,
      49.60000228881836,
      true,
    ],
    [
      "social-media-repo",
      217.1999969482422,
      4523.000061035156,
      95.45000457763672,
      25.600000381469727,
      true,
    ],
    [
      "fresh-cart-repo",
      761.2000122070312,
      4574.800048828125,
      95.45000457763672,
      25.600000381469727,
      true,
    ],
    [
      "contact-email",
      184.40000915527344,
      5776.4000244140625,
      194.7375030517578,
      25.600000381469727,
      false,
    ],
    [
      "contact-linkedin",
      184.40000915527344,
      5810.0001220703125,
      60.01250076293945,
      25.600000381469727,
      false,
    ],
    [
      "contact-github",
      184.40000915527344,
      5843.60009765625,
      50.9375,
      25.600000381469727,
      false,
    ],
  ];
  snapshot.targets = links.map(([id, x, y, width, height, enabled], order) => ({
    id,
    label: id,
    order,
    rect: box(x, y, width, height),
    enabled,
  }));
  snapshot.plannedTargets = snapshot.targets.map((target) => ({ ...target, enabled: true }));
  const supports: Array<[string, SectionId, number, number, number]> = [
    ["stack-frontend-top", "tech-stack", 184.40000915527344, 2076.4000244140625, 516],
    ["stack-backend-top", "tech-stack", 724.4000244140625, 2076.4000244140625, 516],
    ["stack-databases-data-top", "tech-stack", 184.40000915527344, 2322, 516],
    [
      "stack-system-design-architecture-top",
      "tech-stack",
      184.40000915527344,
      2567.5999755859375,
      1056,
    ],
    [
      "stack-cloud-tooling-top",
      "tech-stack",
      184.40000915527344,
      2813.2000122070312,
      516,
    ],
    ["project-quick-bite-top", "projects", 184.40000915527344, 3373.000030517578, 1056],
    ["project-social-media-top", "projects", 184.40000915527344, 4196.000061035156, 512],
    ["project-fresh-cart-top", "projects", 728.4000244140625, 4196.000061035156, 512],
  ];
  snapshot.plannedSurfaces = supports.map(([id, section, x, y, width]) => ({
    id,
    section,
    x,
    y,
    width,
    checkpoint: false,
  }));
  snapshot.surfaces = snapshot.plannedSurfaces.filter(
    (surface) => surface.section === "projects",
  );
  return snapshot;
}

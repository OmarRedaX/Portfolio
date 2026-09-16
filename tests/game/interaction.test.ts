import test from "node:test";
import assert from "node:assert/strict";
import { activateSelected, selectTarget } from "../../lib/game/interaction";
import type { Body, GeometrySnapshot, TargetBox, Tuning } from "../../lib/game/model";

const tuning: Tuning = {
  step: 1 / 120,
  speed: 240,
  gravity: 1400,
  jumpSpeed: 560,
  bodyWidth: 24,
  bodyHeight: 32,
  landingMargin: 4,
  reachX: 32,
  reachY: 40,
};

const groundedBody: Body = {
  x: 100,
  y: 200,
  width: 24,
  height: 32,
  vx: 0,
  vy: 0,
  groundedOn: "projects-action-row",
};

function target(
  id: string,
  order: number,
  centerX: number,
  centerY: number,
  enabled = true,
): TargetBox {
  return {
    id,
    label: id,
    order,
    rect: { x: centerX - 10, y: centerY - 10, width: 20, height: 20 },
    enabled,
  };
}

const bodyCenter = {
  x: groundedBody.x + groundedBody.width / 2,
  y: groundedBody.y + groundedBody.height / 2,
};

test("airborne avatar never selects an action", () => {
  const airborne = { ...groundedBody, vy: 1, groundedOn: null };
  assert.equal(
    selectTarget(airborne, [target("near", 0, bodyCenter.x, bodyCenter.y)], tuning),
    null,
  );
});

test("stable document order resolves equal horizontal distances", () => {
  const earlier = target("earlier", 0, bodyCenter.x - 20, bodyCenter.y);
  const later = target("later", 1, bodyCenter.x + 20, bodyCenter.y);

  assert.equal(selectTarget(groundedBody, [later, earlier], tuning), "earlier");
  assert.equal(selectTarget(groundedBody, [earlier, later], tuning), "earlier");
});

test("selection includes exact reach boundaries and rejects beyond them", () => {
  const horizontalEdge = target(
    "horizontal-edge",
    0,
    bodyCenter.x + tuning.reachX,
    bodyCenter.y,
  );
  const verticalEdge = target(
    "vertical-edge",
    1,
    bodyCenter.x,
    bodyCenter.y + tuning.reachY,
  );
  const outsideHorizontal = target(
    "outside-horizontal",
    2,
    bodyCenter.x + tuning.reachX + 0.01,
    bodyCenter.y,
  );
  const outsideVertical = target(
    "outside-vertical",
    3,
    bodyCenter.x,
    bodyCenter.y + tuning.reachY + 0.01,
  );

  assert.equal(selectTarget(groundedBody, [horizontalEdge], tuning), "horizontal-edge");
  assert.equal(selectTarget(groundedBody, [verticalEdge], tuning), "vertical-edge");
  assert.equal(
    selectTarget(groundedBody, [outsideHorizontal, outsideVertical], tuning),
    null,
  );
});

test("nearest horizontal candidate wins after disabled and vertical candidates are filtered", () => {
  const disabledNear = target("disabled-near", 0, bodyCenter.x, bodyCenter.y, false);
  const verticallyFar = target(
    "vertically-far",
    1,
    bodyCenter.x + 1,
    bodyCenter.y + tuning.reachY + 1,
  );
  const eligible = target("eligible", 2, bodyCenter.x + 12, bodyCenter.y + 8);

  assert.equal(
    selectTarget(groundedBody, [disabledNear, verticallyFar, eligible], tuning),
    "eligible",
  );
});

function snapshotWith(
  id: string,
  element: HTMLElement,
  targets: TargetBox[],
): GeometrySnapshot {
  const emptyRect = { x: 0, y: 0, width: 0, height: 0 };
  return {
    surfaces: [],
    plannedSurfaces: [],
    targets,
    elements: new Map([[id, element]]),
    sectionBounds: {
      hero: emptyRect,
      about: emptyRect,
      "tech-stack": emptyRect,
      projects: emptyRect,
      experience: emptyRect,
      contact: emptyRect,
    },
    sectionAnchors: {
      hero: emptyRect,
      about: emptyRect,
      "tech-stack": emptyRect,
      projects: emptyRect,
      experience: emptyRect,
      contact: emptyRect,
    },
    obstacles: [],
    actionRows: [],
    plannedActionRows: [],
    headerBottom: 0,
    revealsSettled: true,
  };
}

test("activation clicks only the still-current visibly presented target", () => {
  let clicks = 0;
  const element = {
    isConnected: true,
    getClientRects: () => [{}],
    click: () => clicks++,
  } as unknown as HTMLElement;
  const selected = target("case-study", 0, bodyCenter.x, bodyCenter.y);
  const snapshot = snapshotWith("case-study", element, [selected]);

  assert.equal(
    activateSelected("case-study", "case-study", groundedBody, snapshot, tuning),
    true,
  );
  assert.equal(clicks, 1);
});

test("activation rejects unpresented, stale, disconnected, and paused selections", () => {
  let clicks = 0;
  let connected = true;
  let rendered = true;
  const element = {
    get isConnected() {
      return connected;
    },
    getClientRects: () => (rendered ? [{}] : []),
    click: () => clicks++,
  } as unknown as HTMLElement;
  const selected = target("github", 0, bodyCenter.x, bodyCenter.y);
  const snapshot = snapshotWith("github", element, [selected]);

  assert.equal(activateSelected("github", null, groundedBody, snapshot, tuning), false);
  assert.equal(
    activateSelected(
      "github",
      "github",
      { ...groundedBody, x: groundedBody.x + tuning.reachX + 40 },
      snapshot,
      tuning,
    ),
    false,
  );
  connected = false;
  assert.equal(
    activateSelected("github", "github", groundedBody, snapshot, tuning),
    false,
  );
  connected = true;
  rendered = false;
  assert.equal(
    activateSelected("github", "github", groundedBody, snapshot, tuning),
    false,
  );
  assert.equal(clicks, 0);
});

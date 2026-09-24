import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, step } from '../../lib/game/physics';
import type { Body, Surface, Tuning } from '../../lib/game/model';

const tuning: Tuning = { step: 1 / 120, speed: 240, gravity: 1400, jumpSpeed: 560, bodyWidth: 24, bodyHeight: 32, landingMargin: 4, reachX: 32, reachY: 40 };
const floor: Surface = { id: 'hero', section: 'hero', x: 0, y: 100, width: 120, checkpoint: true };

test('descending feet crossing lands exactly on the top', () => {
  const body: Body = { x: 20, y: 67, width: 24, height: 32, vx: 0, vy: 240, groundedOn: null };
  const result = step(body, { direction: 0, jumpPressed: false }, [floor], tuning);
  assert.equal(result.body.y + result.body.height, 100);
  assert.equal(result.body.vy, 0);
  assert.equal(result.landedOn, 'hero');
});

test('side contact below the top does not snap', () => {
  const body: Body = { x: -25, y: 90, width: 24, height: 32, vx: 0, vy: 20, groundedOn: null };
  assert.equal(step(body, { direction: 1, jumpPressed: false }, [floor], tuning).landedOn, null);
});

test('upward motion passes through a platform', () => {
  const body: Body = { x: 20, y: 100, width: 24, height: 32, vx: 0, vy: -560, groundedOn: null };
  assert.equal(step(body, { direction: 0, jumpPressed: false }, [floor], tuning).landedOn, null);
});

test('the first of two crossed tops wins regardless of surface order', () => {
  const body: Body = { x: 20, y: 50, width: 24, height: 32, vx: 0, vy: 2400, groundedOn: null };
  const higher = { ...floor, id: 'higher', y: 90 };
  const lower = { ...floor, id: 'lower', y: 100 };
  assert.equal(step(body, { direction: 0, jumpPressed: false }, [lower, higher], tuning).landedOn, 'higher');
});

test('exact horizontal edge contact is not overlap', () => {
  const body: Body = { x: -24, y: 67, width: 24, height: 32, vx: 0, vy: 240, groundedOn: null };
  assert.equal(step(body, { direction: 0, jumpPressed: false }, [floor], tuning).landedOn, null);
});

test('grounded body remains still on support', () => {
  const body = spawn(floor, tuning);
  const result = step(body, { direction: 0, jumpPressed: false }, [floor], tuning);
  assert.equal(result.body.y, 68);
  assert.equal(result.body.vy, 0);
  assert.equal(result.body.groundedOn, 'hero');
});

test('jump starts once from support', () => {
  const first = step(spawn(floor, tuning), { direction: 0, jumpPressed: true }, [floor], tuning);
  const second = step(first.body, { direction: 0, jumpPressed: true }, [floor], tuning);
  assert.equal(first.body.groundedOn, null);
  assert.ok(first.body.vy < 0);
  assert.ok(second.body.vy > first.body.vy);
});

test('walking clear of support resumes falling', () => {
  const body: Body = { ...spawn(floor, tuning), x: 119 };
  const result = step(body, { direction: 1, jumpPressed: false }, [floor], tuning);
  assert.equal(result.body.groundedOn, null);
  assert.ok(result.body.vy > 0);
});

test('frame accumulation reaches the same fixed-step position at common refresh rates', () => {
  const simulate = (hz: number): Body => {
    let body = spawn(floor, tuning);
    let accumulator = 0;
    for (let frame = 0; frame < hz; frame++) {
      accumulator += Math.min(1 / hz, 0.1);
      while (accumulator + 1e-10 >= tuning.step) {
        body = step(body, { direction: 1, jumpPressed: false }, [floor], tuning).body;
        accumulator -= tuning.step;
      }
    }
    return body;
  };
  const x30 = simulate(30).x;
  for (const hz of [60, 144]) assert.ok(Math.abs(simulate(hz).x - x30) <= tuning.speed * tuning.step);
});

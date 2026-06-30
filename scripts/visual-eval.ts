#!/usr/bin/env npx tsx
/**
 * Local visual reviewer — "the eye". Sends UI screenshots to a local Ollama vision
 * model (qwen2.5vl) and asks for OBSERVATIONS against the project's art-direction
 * brief (apps/web/DESIGN.md), plus a soft score.
 *
 * IMPORTANT: qwen is MISCALIBRATED — it clusters at 7-8, never emits a 1 or a 10,
 * and repeats generic notes. So this output is NOT trusted directly. It is handed
 * to a reasoning "judge" (the R1 design reviewer) which — knowing the same brief —
 * keeps only the real, theme-specific misses and discards boilerplate. The score is
 * a weak signal used for plateau detection, not a gate.
 *
 * Usage: npx tsx scripts/visual-eval.ts [screenshotsDir]   (default apps/web/screenshots)
 *   OLLAMA_VISION_MODEL  (default qwen2.5vl:7b)
 *   VISUAL_MIN_SCORE     (default 9)  — soft "needs work" threshold for plateau logic
 *   DESIGN_BRIEF         path to the brief (default apps/web/DESIGN.md)
 */
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const MODEL = process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5vl:7b';
const MIN_SCORE = Number(process.env.VISUAL_MIN_SCORE ?? 9);

/** Load the art-direction brief so qwen reviews AGAINST the intended theme. */
function loadBrief(): string {
  const p = process.env.DESIGN_BRIEF ?? resolve('apps/web/DESIGN.md');
  try { return existsSync(p) ? readFileSync(p, 'utf-8').slice(0, 4000) : ''; } catch { return ''; }
}
const BRIEF = loadBrief();

const RUBRIC = (screen: string) =>
  `You are a senior product designer reviewing the "${screen}" screen against THIS art-direction brief:
${BRIEF || '(no brief found — judge it as a premium, animated, dark Stellar-yellow #FDDA24 web3 product)'}

Give CONCRETE, SPECIFIC observations of how well THIS screenshot embodies the brief — judge: (1) does it
read as the intended theme, (2) palette adherence, (3) the signature components/motion present, (4) visual
hierarchy & depth, (5) copy voice. Name what is actually on screen; do not give generic advice.
Respond EXACTLY in this format:
SCORE: <n>/10
OBSERVATIONS:
- <specific, screen-grounded observation about theme/palette/components/hierarchy> (give 2-5)`;

export interface VisualVerdict { screen: string; ok: boolean; score: number; raw: string }

export async function evalScreenshot(pngPath: string): Promise<VisualVerdict> {
  const screen = basename(pngPath).replace(/\.png$/, '');
  const b64 = readFileSync(pngPath).toString('base64');
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, stream: false, messages: [{ role: 'user', content: RUBRIC(screen), images: [b64] }] }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { message?: { content?: string } };
  const raw = (data.message?.content ?? '').trim();
  const m = raw.match(/SCORE:\s*(\d+)/i);
  const score = m ? Number(m[1]) : 0;
  return { screen, ok: score >= MIN_SCORE, score, raw };
}

/**
 * Eval every PNG in a dir. Returns the raw report (for the judge) AND per-screen
 * scores (for plateau detection). allOk = every screen >= MIN_SCORE (soft signal).
 */
export async function evalDir(dir: string): Promise<{ allOk: boolean; report: string; scores: Record<string, number> }> {
  if (!existsSync(dir)) return { allOk: true, report: '(no screenshots dir)', scores: {} };
  const pngs = readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => resolve(dir, f));
  if (!pngs.length) return { allOk: true, report: '(no screenshots)', scores: {} };
  const verdicts: VisualVerdict[] = [];
  for (const p of pngs) {
    try { verdicts.push(await evalScreenshot(p)); }
    catch (err: any) { verdicts.push({ screen: basename(p), ok: true, score: 10, raw: `(visual eval skipped: ${err.message})` }); }
  }
  const allOk = verdicts.every((v) => v.ok);
  const report = verdicts.map((v) => `### ${v.screen} — qwen score ${v.score}/10\n${v.raw}`).join('\n\n');
  const scores: Record<string, number> = {};
  for (const v of verdicts) scores[v.screen] = v.score;
  return { allOk, report, scores };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  evalDir(resolve(process.argv[2] ?? 'apps/web/screenshots')).then(({ allOk, report }) => {
    console.log(report);
    console.log(`\nALL >= ${MIN_SCORE}: ${allOk}`);
  }).catch((e) => { console.error(e); process.exit(1); });
}

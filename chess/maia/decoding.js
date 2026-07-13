// Policy decoding — JS port of hunterchen7/play-lc0 src/engine/decoding.ts.
// Maps the 1858-element Lc0 policy output to a legal move (masked + softmax).
import { POLICY_INDEX_MAP } from './policyIndex.js';
import { flipUci } from './encoding.js';

// policyLogits: Float32Array(1858). legalMoves: UCI strings for the current position.
// isBlack: side to move. temperature: 0 = argmax (most-likely human move), >0 = sample.
export function decodePolicyOutput(policyLogits, legalMoves, isBlack, temperature = 0){
  if (legalMoves.length === 0) throw new Error('No legal moves to decode');

  const moveLogits = [];
  for (const uci of legalMoves){
    const canonicalMove = isBlack ? flipUci(uci) : uci;          // policy map is white-perspective
    let index = POLICY_INDEX_MAP.get(canonicalMove);
    if (index === undefined && canonicalMove.endsWith('n')) {     // knight promo: no suffix in map
      index = POLICY_INDEX_MAP.get(canonicalMove.slice(0, 4));
    }
    if (index === undefined){ console.warn(`No policy index for ${uci} (${canonicalMove})`); continue; }
    moveLogits.push({ move: uci, logit: policyLogits[index] });
  }
  if (moveLogits.length === 0) throw new Error('No legal moves mapped to policy indices');

  const maxLogit = Math.max(...moveLogits.map(m => m.logit));
  const temp = temperature > 0 ? temperature : 1;
  const exps = moveLogits.map(m => Math.exp((m.logit - maxLogit) / temp));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExp);

  const scored = moveLogits.map((m, i) => ({ move: m.move, confidence: probs[i] }));
  scored.sort((a, b) => b.confidence - a.confidence);

  let selected;
  if (temperature > 0){
    const rand = Math.random();
    let cumulative = 0;
    selected = scored[scored.length - 1];          // fallback
    for (const mv of scored){ cumulative += mv.confidence; if (rand <= cumulative){ selected = mv; break; } }
  } else {
    selected = scored[0];
  }

  return { best: selected, topMoves: scored.slice(0, 5) };
}

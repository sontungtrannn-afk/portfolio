// Maia in-browser brain.
//   model:    official Maia 1900 (CSSLab / U-Toronto), Lc0 net converted to ONNX.
//   encoding: Lc0 112-plane input + 1858 policy map (ports of hunterchen7/play-lc0).
//   runtime:  onnxruntime-web (WASM, single-thread → no COOP/COEP headers required),
//             self-hosted in ./ort/ so it loads on any network (no third-party CDN).
// One forward pass per move (no search) = how Maia is meant to run.
import * as ort from './ort/ort.wasm.min.mjs';
import { encodeFenHistory } from './encoding.js';
import { decodePolicyOutput } from './decoding.js';

ort.env.wasm.wasmPaths = new URL('./ort/', import.meta.url).href;  // resolved from THIS module, not the page
ort.env.wasm.numThreads = 1;

let session = null;
let inputName = '/input/planes';
let outputNames = [];
let ready = false;

export function isReady(){ return ready; }

export async function initMaia(modelUrl){
  if (session) return;
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`model fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  session = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'] });
  inputName = session.inputNames[0] || inputName;
  outputNames = [...session.outputNames];
  ready = true;
}

// fenHistory: array of FENs oldest→current. legalMoves: UCI strings for the current position.
// temperature: 0 = always the most-likely human move; >0 = sample (a little variety).
// Returns { move (UCI), confidence, top }.
export async function pickMove(fenHistory, legalMoves, temperature = 0.4){
  if (!session) throw new Error('Maia not initialized');
  const isBlack = fenHistory[fenHistory.length - 1].split(' ')[1] === 'b';

  const input = encodeFenHistory(fenHistory);
  const feeds = { [inputName]: new ort.Tensor('float32', input, [1, 112, 8, 8]) };
  const results = await session.run(feeds);

  let policy = null;
  for (const name of outputNames){
    if (name.toLowerCase().includes('policy')){ policy = new Float32Array(results[name].data); break; }
  }
  if (!policy) throw new Error('model has no policy output');

  const decoded = decodePolicyOutput(policy, legalMoves, isBlack, temperature);
  return { move: decoded.best.move, confidence: decoded.best.confidence, top: decoded.topMoves };
}

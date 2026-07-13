// Lc0 input encoding — JS port of hunterchen7/play-lc0 src/engine/encoding.ts.
// Encodes a position (with history) into the [1, 112, 8, 8] float32 tensor Lc0/Maia expects.
//
// Plane layout (112 total):
//   0-103: 13 planes x 8 history positions (most recent first) = 6 own + 6 opp pieces + 1 repetition
//   104-107: castling (us-Q, us-K, them-Q, them-K)
//   108: black-to-move   109: rule50/99   110: zeros   111: all-ones

const TOTAL_PLANES = 112;
const HISTORY_LENGTH = 8;
const PLANES_PER_HISTORY = 13;
const PLANE_SIZE = 64;
const RANKS = '12345678';

const PIECE_PLANES_WHITE = { P:0, N:1, B:2, R:3, Q:4, K:5, p:6, n:7, b:8, r:9, q:10, k:11 };
const PIECE_PLANES_BLACK = { p:0, n:1, b:2, r:3, q:4, k:5, P:6, N:7, B:8, R:9, Q:10, K:11 };

export function flipRank(square){
  const file = square[0];
  const rankIndex = RANKS.indexOf(square[1]);
  if (rankIndex < 0) return square;
  return `${file}${RANKS[7 - rankIndex]}`;
}

export function flipUci(uci){
  if (uci.length < 4) return uci;
  const from = flipRank(uci.slice(0, 2));
  const to = flipRank(uci.slice(2, 4));
  const promo = uci.length > 4 ? uci.slice(4) : '';
  return `${from}${to}${promo}`;
}

function writeConstantPlane(planes, planeIndex, value){
  const offset = planeIndex * PLANE_SIZE;
  for (let i = 0; i < PLANE_SIZE; i++) planes[offset + i] = value;
}

const normalizeFenKey = (fen) => fen.split(' ').slice(0, 4).join(' ');

function buildRepetitionFlags(fenHistory){
  const counts = new Map();
  return fenHistory.map((fen) => {
    const key = normalizeFenKey(fen);
    const current = counts.get(key) ?? 0;
    counts.set(key, current + 1);
    return current > 0;
  });
}

// fenHistory: all FENs from the game, oldest first / current LAST.
export function encodeFenHistory(fenHistory){
  if (fenHistory.length === 0) throw new Error('fenHistory must include at least the current position');

  const currentFen = fenHistory[fenHistory.length - 1];
  const fenParts = currentFen.split(' ');
  const sideToMove = fenParts[1] ?? 'w';
  const castling = fenParts[2] ?? '-';
  const halfmoveClock = Number(fenParts[4] ?? '0');
  const isBlack = sideToMove === 'b';

  const piecePlanes = isBlack ? PIECE_PLANES_BLACK : PIECE_PLANES_WHITE;
  const repetitionFlags = buildRepetitionFlags(fenHistory);
  const planes = new Float32Array(TOTAL_PLANES * PLANE_SIZE);

  const recentPositions = fenHistory.slice(-HISTORY_LENGTH).reverse();   // most recent first
  const recentRepetitions = repetitionFlags.slice(-HISTORY_LENGTH).reverse();

  for (let historyIndex = 0; historyIndex < HISTORY_LENGTH; historyIndex++){
    const fen = recentPositions[historyIndex];
    if (!fen) continue;
    const [boardPart] = fen.split(' ');
    const ranks = boardPart.split('/');
    const basePlane = historyIndex * PLANES_PER_HISTORY;

    let rank = 7;                       // FEN lists rank 8 first
    for (const rankStr of ranks){
      let file = 0;
      for (const ch of rankStr){
        if (ch >= '1' && ch <= '8'){ file += Number(ch); }
        else {
          const planeIndex = piecePlanes[ch];
          if (planeIndex !== undefined){
            const actualRank = isBlack ? 7 - rank : rank;   // vertical flip for black
            const squareIndex = actualRank * 8 + file;
            planes[(basePlane + planeIndex) * PLANE_SIZE + squareIndex] = 1.0;
          }
          file += 1;
        }
      }
      rank -= 1;
    }
    if (recentRepetitions[historyIndex]) writeConstantPlane(planes, basePlane + 12, 1.0);
  }

  // castling from us/them perspective
  if (isBlack){
    writeConstantPlane(planes, 104, castling.includes('q') ? 1.0 : 0.0);
    writeConstantPlane(planes, 105, castling.includes('k') ? 1.0 : 0.0);
    writeConstantPlane(planes, 106, castling.includes('Q') ? 1.0 : 0.0);
    writeConstantPlane(planes, 107, castling.includes('K') ? 1.0 : 0.0);
  } else {
    writeConstantPlane(planes, 104, castling.includes('Q') ? 1.0 : 0.0);
    writeConstantPlane(planes, 105, castling.includes('K') ? 1.0 : 0.0);
    writeConstantPlane(planes, 106, castling.includes('q') ? 1.0 : 0.0);
    writeConstantPlane(planes, 107, castling.includes('k') ? 1.0 : 0.0);
  }
  writeConstantPlane(planes, 108, isBlack ? 1.0 : 0.0);
  writeConstantPlane(planes, 109, Math.min(halfmoveClock / 99.0, 1.0));
  writeConstantPlane(planes, 110, 0.0);
  writeConstantPlane(planes, 111, 1.0);

  return planes;
}

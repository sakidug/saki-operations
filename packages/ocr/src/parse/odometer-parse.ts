/**
 * Parse OCR raw text into plausible odometer readings.
 * Prefers 5–7 digit dashboard runs and can bias with a previous KM reading.
 */

import type { OcrRawCandidate } from '../types';

const DIGIT_RUN = /(?:\d[\d\s,.]*){3,}/g;

export function stripToDigits(input: string): string {
  return input.replace(/\D/g, '');
}

export function formatOdometerKm(digits: string): string {
  const clean = stripToDigits(digits);
  if (!clean) return '';
  return Number(clean).toLocaleString('en-US');
}

/** Common OCR letter → digit repairs when whitelist still leaks confusable glyphs. */
export function repairDigitConfusions(raw: string): string {
  return raw
    .replace(/[OoDdQ]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[Gg]/g, '6');
}

export type CandidatePickHints = {
  previousKm?: number | null;
};

export function parseOdometerCandidates(
  rawText: string,
  baseConfidence = 70,
): OcrRawCandidate[] {
  const normalized = repairDigitConfusions(rawText);
  const matches = normalized.match(DIGIT_RUN) ?? [];
  const scored: OcrRawCandidate[] = [];

  for (const match of matches) {
    const digits = stripToDigits(match);
    if (digits.length < 4 || digits.length > 8) continue;
    // Leading zeros are rare on full odometers — usually truncation artefacts.
    if (digits.length >= 5 && digits.startsWith('0')) continue;

    let confidence = baseConfidence;
    if (digits.length === 6) confidence += 22;
    else if (digits.length === 5 || digits.length === 7) confidence += 16;
    else if (digits.length === 4 || digits.length === 8) confidence += 6;

    if (match.includes(',') || match.includes(' ') || match.includes('.')) {
      confidence += 3;
    }

    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    scored.push({
      value: digits,
      confidence,
      rawTextSnippet: match.trim().slice(0, 32),
    });
  }

  scored.sort((a, b) => b.confidence - a.confidence || b.value.length - a.value.length);

  const seen = new Set<string>();
  const unique: OcrRawCandidate[] = [];
  for (const candidate of scored) {
    if (seen.has(candidate.value)) continue;
    seen.add(candidate.value);
    unique.push(candidate);
  }

  return unique;
}

export function scoreCandidateWithHints(
  candidate: OcrRawCandidate,
  hints?: CandidatePickHints,
): number {
  let score = candidate.confidence;
  const previous = hints?.previousKm;
  if (previous == null || !Number.isFinite(previous)) return score;

  const prevDigits = String(Math.floor(previous));
  const valueNum = Number(candidate.value);
  if (!Number.isFinite(valueNum)) return score - 40;

  // Prefer same digit length (preserves leading digits).
  if (candidate.value.length === prevDigits.length) score += 18;
  else if (Math.abs(candidate.value.length - prevDigits.length) === 1) score += 4;
  else score -= 20;

  if (valueNum >= previous) score += 12;
  else score -= 35;

  const delta = valueNum - previous;
  if (delta >= 0 && delta <= 2000) score += 10;
  if (delta > 10_000) score -= 25;

  // Strongly punish truncated readings (e.g. 291451 → 20345).
  if (
    candidate.value.length < prevDigits.length &&
    valueNum < previous * 0.5
  ) {
    score -= 40;
  }

  return score;
}

export function pickBestCandidate(
  candidates: OcrRawCandidate[],
  hints?: CandidatePickHints,
): OcrRawCandidate | null {
  if (candidates.length === 0) return null;
  if (!hints?.previousKm && hints?.previousKm !== 0) {
    return candidates[0] ?? null;
  }

  let best: OcrRawCandidate | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const score = scoreCandidateWithHints(candidate, hints);
    if (score > bestScore) {
      bestScore = score;
      best = { ...candidate, confidence: Math.max(0, Math.min(100, Math.round(score))) };
    }
  }
  return best;
}

/** Merge multi-pass OCR candidates by value, keeping highest confidence. */
export function mergeOcrCandidates(groups: OcrRawCandidate[][]): OcrRawCandidate[] {
  const map = new Map<string, OcrRawCandidate>();
  for (const group of groups) {
    for (const candidate of group) {
      const existing = map.get(candidate.value);
      if (!existing || candidate.confidence > existing.confidence) {
        map.set(candidate.value, candidate);
      }
    }
  }
  return [...map.values()].sort(
    (a, b) => b.confidence - a.confidence || b.value.length - a.value.length,
  );
}

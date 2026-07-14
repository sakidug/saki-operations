/**
 * Parse OCR raw text into plausible odometer readings.
 * Prefers longer digit runs typical of vehicle dashboards (5–7 digits).
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

export function parseOdometerCandidates(
  rawText: string,
  baseConfidence = 70,
): OcrRawCandidate[] {
  const matches = rawText.match(DIGIT_RUN) ?? [];
  const scored: OcrRawCandidate[] = [];

  for (const match of matches) {
    const digits = stripToDigits(match);
    if (digits.length < 3 || digits.length > 8) continue;

    // Prefer typical cluster lengths for modern digital odometers.
    let confidence = baseConfidence;
    if (digits.length >= 5 && digits.length <= 7) confidence += 18;
    else if (digits.length === 4 || digits.length === 8) confidence += 8;

    if (match.includes(',') || match.includes(' ')) confidence += 4;
    if (/[oOIl]/.test(match)) confidence -= 12;

    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    scored.push({
      value: digits,
      confidence,
      rawTextSnippet: match.trim().slice(0, 32),
    });
  }

  scored.sort((a, b) => b.confidence - a.confidence || b.value.length - a.value.length);

  // Deduplicate identical digit values, keep highest confidence
  const seen = new Set<string>();
  const unique: OcrRawCandidate[] = [];
  for (const candidate of scored) {
    if (seen.has(candidate.value)) continue;
    seen.add(candidate.value);
    unique.push(candidate);
  }

  return unique;
}

export function pickBestCandidate(
  candidates: OcrRawCandidate[],
): OcrRawCandidate | null {
  return candidates[0] ?? null;
}

import { EventModel, RecommendationResult, SessionDetail } from './eventModel';

export interface ScoredRecommendation {
  readonly session: SessionDetail;
  readonly score: number;
  readonly matchedInterestTerms: ReadonlyArray<string>;
  readonly matchReasons: ReadonlyArray<string>;
}

function tokenizeInterests(interests: string): string[] {
  return interests
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function scoreSessionForTerm(session: SessionDetail, term: string): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (session.title.toLowerCase().includes(term)) {
    score += 4;
    reasons.push(`title matches "${term}"`);
  }

  if (session.abstract && session.abstract.toLowerCase().includes(term)) {
    score += 3;
    reasons.push(`abstract matches "${term}"`);
  }

  if (session.sessionType.toLowerCase().includes(term)) {
    score += 2;
    reasons.push(`session type matches "${term}"`);
  }

  const categoryMatch = session.categories.find((category) =>
    category.name.toLowerCase().includes(term)
  );
  if (categoryMatch) {
    score += 3;
    reasons.push(`category "${categoryMatch.name}" matches "${term}"`);
  }

  const speakerMatch = session.speakers.find((speaker) =>
    speaker.name.toLowerCase().includes(term)
  );
  if (speakerMatch) {
    score += 2;
    reasons.push(`speaker "${speakerMatch.name}" matches "${term}"`);
  }

  return { score, reasons };
}

export function recommendSessions(
  model: EventModel,
  interests: string,
  limit: number
): RecommendationResult[] {
  const terms = Array.from(new Set(tokenizeInterests(interests)));
  if (terms.length === 0) {
    return [];
  }

  const scored: ScoredRecommendation[] = [];

  for (const session of model.flattenedSessions) {
    let totalScore = 0;
    const matchedTerms: string[] = [];
    const reasons: string[] = [];

    for (const term of terms) {
      const result = scoreSessionForTerm(session, term);
      if (result.score > 0) {
        totalScore += result.score;
        matchedTerms.push(term);
        reasons.push(...result.reasons);
      }
    }

    if (totalScore > 0) {
      scored.push({
        session,
        score: totalScore,
        matchedInterestTerms: Array.from(new Set(matchedTerms)),
        matchReasons: Array.from(new Set(reasons)),
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.session.startTime !== b.session.startTime) {
      return a.session.startTime.localeCompare(b.session.startTime);
    }
    return a.session.title.localeCompare(b.session.title);
  });

  return scored.slice(0, limit).map((entry) => ({
    sessionId: entry.session.sessionId,
    title: entry.session.title,
    score: entry.score,
    matchReasons: entry.matchReasons,
    speakers: entry.session.speakers,
    categories: entry.session.categories.map((category) => category.name),
    startTime: entry.session.startTime,
    endTime: entry.session.endTime,
  }));
}

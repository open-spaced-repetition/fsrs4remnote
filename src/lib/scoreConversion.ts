import { QueueInteractionScore, RepetitionStatus } from '@remnote/plugin-sdk';

export enum Rating {
  Again = 1,
  Hard,
  Good,
  Easy,
}

export function filterUnusedQueueInteractionScores<T extends RepetitionStatus>(scores: T[]): T[] {
  return scores.filter(
    (status) =>
      status.score !== QueueInteractionScore.TOO_EARLY &&
      status.score !== QueueInteractionScore.VIEWED_AS_LEECH &&
      status.score !== QueueInteractionScore.RESET
  );
}

export function convertRemNoteScoreToAnkiRating(score: QueueInteractionScore): Rating {
  return score === QueueInteractionScore.AGAIN
    ? Rating.Again
    : score === QueueInteractionScore.HARD
    ? Rating.Hard
    : score === QueueInteractionScore.GOOD
    ? Rating.Good
    : score === QueueInteractionScore.EASY
    ? Rating.Easy
    : null!;
}

export function getRepetitionHistoryWithoutResets(rawHistory: RepetitionStatus[] | undefined) {
  return getRepetitionHistoryWithoutItems(rawHistory, [QueueInteractionScore.RESET]);
}

function takeRightWhile<T>(xs: T[], p: (x: T) => boolean) {
  const arr = xs.slice().reverse();
  const ret: T[] = [];
  for (const x of arr) {
    if (p(x)) {
      ret.push(x);
    } else {
      break;
    }
  }
  return ret;
}

export function getRepetitionHistoryWithoutItems(
  rawHistory: RepetitionStatus[] | undefined,
  scoresThatMakeThisNew: QueueInteractionScore[]
) {
  return takeRightWhile(
    rawHistory || [],
    (x) => !scoresThatMakeThisNew.includes(x.score)
  ).reverse();
}

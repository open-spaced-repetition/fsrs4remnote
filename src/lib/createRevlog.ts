import { Card, RepetitionStatus, RNPlugin } from '@remnote/plugin-sdk';
import * as R from 'remeda';
import {
  convertRemNoteScoreToAnkiRating,
  filterUnusedQueueInteractionScores,
  getRepetitionHistoryWithoutResets,
} from './scoreConversion';

interface RemNoteRepetitionStatusWithCard extends RepetitionStatus {
  card: Card;
}

interface AnkiRevlogRow {
  id: number;
  cid: number;
  usn: number;
  r: number;
  ivl: number;
  // unused
  lastIvl: number;
  factor: number;
  time: number;
  type: number;
}

function convertRepetitionStatusToRevlogRow(
  status: RemNoteRepetitionStatusWithCard
): AnkiRevlogRow {
  const cid = status.card.createdAt;
  const id = (status.date instanceof Date ? status.date : new Date(status.date)).valueOf();
  const usn = -1;
  const r = convertRemNoteScoreToAnkiRating(status.score);
  // current interval in days
  const ivl =
    status.card.nextRepetitionTime! -
    (status.card.lastRepetitionTime || status.card.createdAt) / 1000 / 60 / 60 / 24;
  // unused
  const lastIvl = 0;
  // TODO: not sure what this is
  const factor = 0;
  const time = status.responseTime || 0;
  // TODO: not sure what this is
  const type = 0;

  return { id, cid, usn, r, ivl, lastIvl, factor, time, type };
}

export async function createRevlog(plugin: RNPlugin): Promise<any[][]> {
  const repetitionStatusArray: RemNoteRepetitionStatusWithCard[] = (
    (await plugin.card.getAll()) || []
  ).flatMap((c) =>
    getRepetitionHistoryWithoutResets(c.repetitionHistory || []).map((r) => ({ ...r, card: c }))
  );

  const revlogArray: AnkiRevlogRow[] = filterUnusedQueueInteractionScores(repetitionStatusArray)
    .filter((x) => x.card.nextRepetitionTime != null)
    .map(convertRepetitionStatusToRevlogRow);

  const csvData = R.sortBy(
    revlogArray,
    (revlog) => revlog.cid,
    (revlog) => revlog.id
  ).map((revlog) => {
    return [
      revlog.id,
      revlog.cid,
      revlog.usn,
      revlog.r,
      revlog.ivl,
      revlog.factor,
      revlog.time,
      revlog.type,
    ];
  });
  const header = ['id', 'cid', 'usn', 'r', 'ivl', 'factor', 'time', 'type'];
  return [header, ...csvData];
}

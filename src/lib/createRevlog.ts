import { Card, RepetitionStatus, RNPlugin } from '@remnote/plugin-sdk';
import * as R from 'remeda';
import {
  convertRemNoteScoreToAnkiRating,
  filterUnusedQueueInteractionScores,
  getRepetitionHistoryWithoutResets,
} from './scoreConversion';
import { CustomData, validateCustomData } from './validation';

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

function convertRepetitionStatusToRevlogRow(rep: RemNoteRepetitionStatusWithCard): AnkiRevlogRow {
  const cid = rep.card.createdAt;
  const id = (rep.date instanceof Date ? rep.date : new Date(rep.date)).valueOf();
  const usn = -1;
  const r = convertRemNoteScoreToAnkiRating(rep.score);
  // current interval in days
  const ivl =
    rep.card.nextRepetitionTime! -
    (rep.card.lastRepetitionTime || rep.card.createdAt) / 1000 / 60 / 60 / 24;
  // unused
  const lastIvl = 0;
  const time = rep.responseTime || 0;
  // unused
  const factor = 0;
  // type -- 0=learn, 1=review, 2=relearn, 3=cram
  //
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

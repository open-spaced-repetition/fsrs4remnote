import { Card, RepetitionStatus, RNPlugin } from '@remnote/plugin-sdk';
import * as R from 'remeda';
import { create_init_custom_data } from '../widgets';
import {
  convertRemNoteScoreToAnkiRating,
  filterUnusedQueueInteractionScores,
} from './scoreConversion';
import { validateCustomData } from './validation';

interface RemNoteRepetition {
  card: Card;
  // the repetition this object represents is the last rep in this array
  revlog: RepetitionStatus[];
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

function convertRepetitionStatusToRevlogRow(data: RemNoteRepetition): AnkiRevlogRow {
  const currentRep = data.revlog[data.revlog.length - 1];
  const card = data.card;
  const cid = card.createdAt;
  const id = (
    currentRep.date instanceof Date ? currentRep.date : new Date(currentRep.date)
  ).valueOf();
  const usn = -1;
  const r = convertRemNoteScoreToAnkiRating(currentRep.score);
  // current interval in days
  const ivl =
    card.nextRepetitionTime! - (card.lastRepetitionTime || card.createdAt) / 1000 / 60 / 60 / 24;
  // unused
  const lastIvl = 0;
  const time = currentRep.responseTime || 0;
  // unused
  const factor = 0;
  // type -- 0=learn, 1=review, 2=relearn, 3=cram
  const pluginData = currentRep.pluginData;
  let type = 0;
  if (validateCustomData(pluginData)) {
    type = pluginData.stage;
  } else {
    type = create_init_custom_data(currentRep, data.revlog).stage;
  }

  return { id, cid, usn, r, ivl, lastIvl, factor, time, type };
}

export async function createRevlog(plugin: RNPlugin): Promise<any[][]> {
  const repetitionStatusArray: RemNoteRepetition[] = ((await plugin.card.getAll()) || []).flatMap(
    (c) =>
      filterUnusedQueueInteractionScores(c.repetitionHistory || []).map((_, i, arr) => ({
        revlog: arr.slice(0, i + 1),
        card: c,
      }))
  );

  const revlogArray: AnkiRevlogRow[] = repetitionStatusArray
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

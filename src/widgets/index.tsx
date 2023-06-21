import {
  declareIndexPlugin,
  QueueInteractionScore,
  ReactRNPlugin,
  RepetitionStatus,
  SpecialPluginCallback,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { defaultParameters, SchedulerParameterTypes } from '../lib/parameters';
import 'seedrandom';
import seedrandom from 'seedrandom';
import { SchedulerParam } from '../lib/consts';
import {
  convertRemNoteScoreToAnkiRating,
  filterUnusedQueueInteractionScores,
  Rating,
} from '../lib/scoreConversion';
import { createRevlog } from '../lib/createRevlog';
import { CustomData, Stage, validateCustomData } from '../lib/validation';

export function create_init_custom_data(
  currentRep: RepetitionStatus,
  revlogs: RepetitionStatus[]
): CustomData {
  if (
    revlogs.length == 1 ||
    (new Date(currentRep.scheduled!).getTime() -
      new Date(revlogs[revlogs.length - 2].date).getTime()) /
      (1000 * 60 * 60 * 24) <=
      1
  ) {
    return {
      difficulty: 0,
      stability: 0,
      stage: Stage.New,
      lastReview: currentRep.date,
    };
  }
  return {
    difficulty: 5,
    stability:
      (new Date(currentRep.scheduled!).getTime() -
        new Date(revlogs[revlogs.length - 2].date).getTime()) /
      (1000 * 60 * 60 * 24),
    stage: Stage.Review,
    lastReview: revlogs[revlogs.length - 2].date,
  };
}

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.scheduler.registerCustomScheduler('FSRS4RemNote', Object.values(defaultParameters));

  await plugin.app.registerCommand({
    name: 'Create Revlog CSV',
    id: 'create-revlog-csv',
    action: async () => {
      const log = await createRevlog(plugin);
      console.log(log);
    },
  });

  await plugin.app.registerCallback<SpecialPluginCallback.SRSScheduleCard>(
    SpecialPluginCallback.SRSScheduleCard,
    getNextSpacingDate
  );

  async function getNextSpacingDate(args: {
    history: RepetitionStatus[];
    schedulerParameters: Record<string, unknown>;
    cardId: string | undefined;
  }) {
    const { history, schedulerParameters, cardId } = args;
    const currentRep = history[history.length - 1];
    const seed = cardId ? cardId + String(history.length) : String(history.length);

    if (
      currentRep.score === QueueInteractionScore.TOO_EARLY ||
      currentRep.score === QueueInteractionScore.VIEWED_AS_LEECH
    ) {
      return { nextDate: new Date(Date.now() + 60 * 60 * 1000).getTime() };
    }

    const revlogs = filterUnusedQueueInteractionScores(history);
    const {
      [SchedulerParam.Weights]: weightsStr,
      [SchedulerParam.RequestRetention]: requestRetention,
      [SchedulerParam.EnableFuzz]: enableFuzz,
      [SchedulerParam.MaximumInterval]: maximumInterval,
      [SchedulerParam.EasyBonus]: easyBonus,
      [SchedulerParam.HardInterval]: hardInterval,
    } = schedulerParameters as SchedulerParameterTypes;

    const w = weightsStr.split(', ').map((x) => Number(x));
    const intervalModifier = Math.log(requestRetention) / Math.log(0.9);

    const customData: CustomData = {
      ...(revlogs.length > 1 && validateCustomData(revlogs[revlogs.length - 2].pluginData)
        ? (revlogs[revlogs.length - 2].pluginData as CustomData)
        : create_init_custom_data(currentRep, revlogs)),
    };

    const convertedScore = convertRemNoteScoreToAnkiRating(currentRep.score);
    let newCustomData = customData;
    let scheduleDays = 0;
    if (customData.stage == Stage.New) {
      newCustomData = init_states(convertedScore);
      scheduleDays =
        convertedScore == Rating.Again
          ? 1 / 1440
          : convertedScore == Rating.Hard
          ? 5 / 1440
          : convertedScore == Rating.Good
          ? 10 / 1440
          : convertedScore == Rating.Easy
          ? next_interval(newCustomData.stability * easyBonus)
          : null!;
    } else if (customData.stage == Stage.Review) {
      const elapsedDays =
        (new Date(currentRep.date).getTime() - new Date(customData.lastReview).getTime()) /
        (1000 * 60 * 60 * 24);
      newCustomData = next_states(convertedScore, customData, elapsedDays);
      let hardIvl = next_interval(customData.stability * hardInterval);
      let goodIvl = Math.max(next_interval(newCustomData.stability), hardIvl + 1);
      let easyIvl = Math.max(next_interval(newCustomData.stability * easyBonus), goodIvl + 1);
      scheduleDays =
        convertedScore == Rating.Again
          ? 1 / 1440
          : convertedScore == Rating.Hard
          ? hardIvl
          : convertedScore == Rating.Good
          ? goodIvl
          : convertedScore == Rating.Easy
          ? easyIvl
          : null!;
    } else if (customData.stage == Stage.Learning || customData.stage == Stage.Relearning) {
      let goodIvl = next_interval(newCustomData.stability);
      let easyIvl = Math.max(next_interval(newCustomData.stability * easyBonus), goodIvl + 1);
      scheduleDays =
        convertedScore == Rating.Again
          ? 5 / 1440
          : convertedScore == Rating.Hard
          ? 10 / 1440
          : convertedScore == Rating.Good
          ? goodIvl
          : convertedScore == Rating.Easy
          ? easyIvl
          : null!;
    }
    newCustomData.stage = next_stage(newCustomData.stage, convertedScore);

    const day = new Date(currentRep.date);
    day.setMinutes(day.getMinutes() + scheduleDays * 1440);
    const time = day.getTime();
    console.log(
      convertedScore,
      history,
      customData,
      newCustomData,
      scheduleDays,
      currentRep.scheduled
    );
    return { nextDate: time, pluginData: newCustomData ? newCustomData : customData };

    function constrain_difficulty(difficulty: number) {
      return Math.min(Math.max(+difficulty.toFixed(2), 1), 10);
    }

    function next_interval(stability: number) {
      const new_interval = apply_fuzz(stability * intervalModifier);
      return Math.min(Math.max(Math.round(new_interval), 1), maximumInterval);
    }

    function apply_fuzz(ivl: number) {
      const generator = seedrandom(seed);
      const fuzz_factor = generator();
      if (!enableFuzz || ivl < 2.5) return ivl;
      ivl = Math.round(ivl);
      const min_ivl = Math.max(2, Math.round(ivl * 0.95 - 1));
      const max_ivl = Math.round(ivl * 1.05 + 1);
      return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl);
    }

    function next_difficulty(d: number, rating: Rating) {
      let next_d = d + w[4] * (rating - 3);
      return constrain_difficulty(mean_reversion(w[2], next_d));
    }

    function mean_reversion(init: number, current: number) {
      return w[5] * init + (1 - w[5]) * current;
    }

    function next_recall_stability(d: number, s: number, r: number) {
      return +(
        s *
        (1 + Math.exp(w[6]) * (11 - d) * Math.pow(s, w[7]) * (Math.exp((1 - r) * w[8]) - 1))
      ).toFixed(2);
    }

    function next_forget_stability(d: number, s: number, r: number) {
      return +(w[9] * Math.pow(d, w[10]) * Math.pow(s, w[11]) * Math.exp((1 - r) * w[12])).toFixed(
        2
      );
    }

    function init_states(rating: Rating): CustomData {
      return {
        difficulty: init_difficulty(rating),
        stability: init_stability(rating),
        stage: Stage.New,
        lastReview: currentRep.date,
      };
    }

    function next_states(rating: Rating, last_states: CustomData, interval: number): CustomData {
      const next_d = next_difficulty(last_states.difficulty, rating);
      const retrievability = Math.exp((Math.log(0.9) * interval) / last_states.stability);
      let next_s;
      if (rating == Rating.Again) {
        next_s = next_forget_stability(next_d, last_states.stability, retrievability);
      } else {
        next_s = next_recall_stability(next_d, last_states.stability, retrievability);
      }
      return {
        difficulty: next_d,
        stability: next_s,
        stage: last_states.stage,
        lastReview: currentRep.date,
      };
    }

    function init_difficulty(rating: Rating) {
      return +constrain_difficulty(w[2] + w[3] * (rating - 3)).toFixed(2);
    }

    function init_stability(rating: Rating) {
      return +Math.max(w[0] + w[1] * (rating - 1), 0.1).toFixed(2);
    }

    function next_stage(current_stage: Stage, rating: Rating): Stage {
      if (current_stage == Stage.New) {
        if (rating == Rating.Again || rating == Rating.Hard || rating == Rating.Good) {
          return Stage.Learning;
        } else {
          return Stage.Review;
        }
      } else if (current_stage == Stage.Learning || current_stage == Stage.Relearning) {
        if (rating == Rating.Again || rating == Rating.Hard) {
          return current_stage;
        } else {
          return Stage.Review;
        }
      } else if (current_stage == Stage.Review) {
        if (rating == Rating.Again) {
          return Stage.Relearning;
        } else {
          return Stage.Review;
        }
      }
      return current_stage;
    }
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);

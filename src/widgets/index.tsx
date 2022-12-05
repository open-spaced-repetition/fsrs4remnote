import { declareIndexPlugin, QueueInteractionScore, ReactRNPlugin, RepetitionStatus, SpecialPluginCallback } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { defaultParameters, SchedulerParameterTypes } from '../lib/parameters';
import {SchedulerParam} from '../lib/consts';

enum Rating {
  Again = 0,
  Hard,
  Good,
  Easy,
}

enum Stage {
  New = 0,
  Learning,
  Review,
  Relearning,
}

interface CustomData {
  difficulty: number,
  stability: number,
  stage: Stage,
  lastReview: number | Date,
}


async function onActivate(plugin: ReactRNPlugin) {
  await plugin.scheduler.registerCustomScheduler(
    "FSRS4RemNote",
    Object.values(defaultParameters)
  )

  await plugin.app.registerCallback<SpecialPluginCallback.SRSScheduleCard>(
    SpecialPluginCallback.SRSScheduleCard,
    getNextSpacingDate
  )

  async function getNextSpacingDate(args: {
    history: RepetitionStatus[],
    schedulerParameters: Record<string, unknown>,
  }) {
    const {history, schedulerParameters} = args;
    const lastRep = history[history.length - 1];
    
    if (lastRep.score === QueueInteractionScore.TOO_EARLY) {
      return null;
    }

    const revlogs = history.filter(status => status.score !== QueueInteractionScore.TOO_EARLY);
    const {
      [SchedulerParam.Weights]: weightsStr,
      [SchedulerParam.RequestRetention]: requestRetention,
      [SchedulerParam.MaximumInterval]: maximumInterval,
      [SchedulerParam.EasyBonus]: easyBonus,
      [SchedulerParam.HardInterval]: hardInterval,
    } = schedulerParameters as SchedulerParameterTypes;

    const w = weightsStr.split(', ').map(x => Number(x));
    const intervalModifier = Math.log(requestRetention) / Math.log(0.9);

    const customData: CustomData = {
      ...revlogs.length>1 && Object.hasOwn(revlogs[revlogs.length - 2], "pluginData")
        ? revlogs[revlogs.length - 2].pluginData as CustomData
        : create_init_custom_data(revlogs)
    }

    const convertedScore =
      lastRep.score === QueueInteractionScore.AGAIN ? Rating.Again
    : lastRep.score === QueueInteractionScore.HARD ? Rating.Hard
    : lastRep.score === QueueInteractionScore.GOOD ? Rating.Good
    : lastRep.score === QueueInteractionScore.EASY ? Rating.Easy
    : null!;

    let newCustomData = customData;
    let scheduleDays = 0;
    if (customData.stage == Stage.New) {
      newCustomData = init_states(convertedScore);
      scheduleDays =
      convertedScore == Rating.Again ? 1 / 1440
      : convertedScore == Rating.Hard ? 5 / 1440
      : convertedScore == Rating.Good ? 10 / 1440
      : convertedScore == Rating.Easy ? next_interval(newCustomData.stability)
      : null!;
    } else if (customData.stage == Stage.Review) {
      const elapsedDays = (lastRep.date - customData.lastReview) / (1000 * 60 * 60 * 24)
      newCustomData = next_states(convertedScore, customData, elapsedDays)
      let hardIvl = next_interval(customData.stability * hardInterval)
      let goodIvl = Math.max(next_interval(newCustomData.stability), hardIvl+1)
      let easyIvl = Math.max(next_interval(newCustomData.stability * easyBonus), goodIvl+1)
      scheduleDays =
      convertedScore == Rating.Again ? 1 / 1440
      : convertedScore == Rating.Hard ? hardIvl
      : convertedScore == Rating.Good ? goodIvl
      : convertedScore == Rating.Easy ? easyIvl
      : null!;
    } else if (customData.stage == Stage.Learning || customData.stage == Stage.Relearning) {
      let hardIvl = next_interval(newCustomData.stability)
      let goodIvl = Math.max(next_interval(newCustomData.stability), hardIvl+1)
      let easyIvl = Math.max(next_interval(newCustomData.stability * easyBonus), goodIvl+1)
      scheduleDays = 
      convertedScore == Rating.Again ? 5 / 1440
      : convertedScore == Rating.Hard ? hardIvl
      : convertedScore == Rating.Good ? goodIvl
      : convertedScore == Rating.Easy ? easyIvl
      : null!;
    }
    newCustomData.stage = next_stage(newCustomData.stage, convertedScore);

    const day = new Date(lastRep.date);
    day.setMinutes(day.getMinutes() + scheduleDays * 1440);
    const time =  day.getTime();
    return { nextDate: time, pluginData: newCustomData ? newCustomData : customData };

    function constrain_difficulty(difficulty: number) {
      return Math.min(Math.max(+difficulty.toFixed(2), 1), 10);
    }

    function next_interval(stability: number) {
      // const new_interval = apply_fuzz(stability * intervalModifier)
      // unsupport fuzz
      const new_interval = stability * intervalModifier
      return Math.min(Math.max(Math.round(new_interval), 1), maximumInterval);
    }

    function next_difficulty(d: number, rating: Rating) {
      let next_d = d + w[4] * (rating - 3);
      return constrain_difficulty(mean_reversion(w[2], next_d));
    }

    function mean_reversion(init: number, current: number) {
      return w[5] * init + (1 - w[5]) * current;
    }

    function next_recall_stability(d: number, s: number, r: number) {
      return +(s * (1 + Math.exp(w[6]) *
            (11 - d) *
            Math.pow(s, w[7]) *
            (Math.exp((1 - r) * w[8]) - 1))).toFixed(2);
    }

    function next_forget_stability(d: number, s: number, r: number) {
      return +(w[9] * Math.pow(d, w[10]) * Math.pow(
            s, w[11]) * Math.exp((1 - r) * w[12])).toFixed(2);
    }

    function init_states(rating: Rating): CustomData {
      return {
        difficulty: init_difficulty(rating),
        stability: init_stability(rating),
        stage: Stage.New,
        lastReview: lastRep.date,
      }
    }

    function next_states(rating: Rating, last_states: CustomData, interval: number): CustomData {
      const next_d = next_difficulty(last_states.difficulty, rating)
      const retrievability = Math.exp(Math.log(0.9) * interval / last_states.stability)
      let next_s
      if (rating == Rating.Again) {
          next_s = next_forget_stability(next_d, last_states.stability, retrievability)
      } else {
          next_s = next_recall_stability(next_d, last_states.stability, retrievability)
      }
      return {
        difficulty: next_d,
        stability: next_s,
        stage: last_states.stage,
        lastReview: lastRep.date,
      }
    }

    function create_init_custom_data(revlogs: RepetitionStatus[]): CustomData {
      if (revlogs.length == 1) {
          return {
            difficulty: 0,
            stability: 0,
            stage: Stage.New,
            lastReview: lastRep.date,
        }
      }
      return {
        difficulty: 5,
        stability: (lastRep.date - revlogs[revlogs.length - 2].date) / (1000 * 60 * 60 * 24),
        stage: Stage.Review,
        lastReview: lastRep.date,
      }
    }

    function init_difficulty(rating: Rating) {
      return +constrain_difficulty(w[2] + w[3] * (rating - 2)).toFixed(2);
    }

    function init_stability(rating: Rating) {
      return +Math.max(w[0] + w[1] * rating, 0.1).toFixed(2);
    }

    function next_stage(current_stage: Stage, rating: Rating): Stage {
      if (current_stage == Stage.New) {
        if (rating == Rating.Again || rating == Rating.Hard || rating == Rating.Good) {
          return Stage.Learning
        } else {
          return Stage.Review
        }
      } else if (current_stage == Stage.Learning || current_stage == Stage.Relearning) {
        if (rating == Rating.Again) {
          return current_stage
        } else {
          return Stage.Review
        }
      } else if (current_stage == Stage.Review) {
        if (rating == Rating.Again) {
          return Stage.Relearning
        } else {
          return Stage.Review
        }
      }
      return current_stage
    }
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);

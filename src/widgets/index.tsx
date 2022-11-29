import { declareIndexPlugin, QueueInteractionScore, ReactRNPlugin, RepetitionStatus, SpecialPluginCallback } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { defaultParameters, SchedulerParameterTypes } from '../lib/parameters';
import {SchedulerParam} from '../lib/consts';

interface CustomData {
  again: {
    d: number
    s: number 
  },
  hard: {
    d: number
    s: number
  },
  good: {
    d: number
    s: number
  },
  easy: {
    d: number
    s: number
  }
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
    const lastRep = history[history.length - 1]

    const {
      [SchedulerParam.Weights]: weightsStr,
      [SchedulerParam.RequestRetention]: requestRetention,
      [SchedulerParam.MaximumInterval]: maximumInterval,
      [SchedulerParam.EasyBonus]: easyBonus,
      [SchedulerParam.HardInterval]: hardInterval,
      [SchedulerParam.Fuzz]: enable_fuzz,
      [SchedulerParam.AgainRating]: againRating,
      [SchedulerParam.HardRating]: hardRating,
      [SchedulerParam.GoodRating]: goodRating,
      [SchedulerParam.EasyRating]: easyRating,
    } = schedulerParameters as SchedulerParameterTypes;

    const w = weightsStr.split(', ').map(x => Number(x));

    const ratings = {
      "again": againRating,
      "hard": hardRating,
      "good": goodRating,
      "easy": easyRating,
    };

    const customData: CustomData = {
      ...lastRep
        ? lastRep.pluginData as CustomData
        : create_init_custom_data()
    }

    const convertedScore =
      lastRep.score === QueueInteractionScore.AGAIN ? ratings["again"]
    : lastRep.score === QueueInteractionScore.HARD ? ratings["hard"]
    : lastRep.score === QueueInteractionScore.GOOD ? ratings["good"]
    : lastRep.score === QueueInteractionScore.EASY ? ratings["easy"]
    : null!

    const day = new Date(lastRep.date);
    day.setDate(day.getDate() + ((history.length * history.length) ^ convertedScore));
    const time =  day.getTime();
    return { nextDate: time, pluginData: {"hello": "world"} }
    
    // auto-calculate intervalModifier
    const intervalModifier = Math.log(requestRetention) / Math.log(0.9);
    // global fuzz factor for all ratings.
    const fuzz_factor = Math.random();

    let states = {
      good: {
        normal: {
          review: {
            scheduledDays: 0
          }
        }
      },
      easy: {
        normal: {
          review: {
            scheduledDays: 0
          }
        }
      },
      hard: {
        normal: {
          review: {
            scheduledDays: 0
          }
        }
      }
    }

    // For new cards
    if (is_new()) {
      init_states();
      states.easy.normal.review.scheduledDays = next_interval(customData.easy.s);
      // For learning/relearning cards
    } else if (is_learning()) {
      // Init states if the card didn't contain customData
      if (is_empty()) {
        init_states();
      }
      const good_interval = next_interval(customData.good.s);
      const easy_interval = Math.max(next_interval(customData.easy.s * easyBonus), good_interval + 1);
      if (states.good.normal?.review) {
        states.good.normal.review.scheduledDays = good_interval;
      }
      if (states.easy.normal?.review) {
        states.easy.normal.review.scheduledDays = easy_interval;
      }
      // For review cards
    } else if (is_review()) {
      // Convert the interval and factor to stability and difficulty if the card didn't contain customData
      if (is_empty()) {
        convert_states();
      }

      const interval = states.current.normal?.review.elapsedDays ? states.current.normal.review.elapsedDays : states.current.filtered.rescheduling.originalState.review.elapsedDays;
      const last_d = customData.again.d;
      const last_s = customData.again.s;
      const retrievability = Math.exp(Math.log(0.9) * interval / last_s);
      // TODO: lapses = times wrong in a row? Or just number of times failed?
      const lapses = states.again.normal?.relearning.review.lapses ? states.again.normal.relearning.review.lapses : states.again.filtered.rescheduling.originalState.relearning.review.lapses;

      customData.again.d = next_difficulty(last_d, "again");
      customData.again.s = next_forget_stability(customData.again.d, last_s, retrievability);

      customData.hard.d = next_difficulty(last_d, "hard");
      customData.hard.s = next_recall_stability(customData.hard.d, last_s, retrievability);

      customData.good.d = next_difficulty(last_d, "good");
      customData.good.s = next_recall_stability(customData.good.d, last_s, retrievability);

      customData.easy.d = next_difficulty(last_d, "easy");
      customData.easy.s = next_recall_stability(customData.easy.d, last_s, retrievability);

      let hard_interval = next_interval(last_s * hardInterval);
      let good_interval = next_interval(customData.good.s);
      let easy_interval = next_interval(customData.easy.s * easyBonus)
      hard_interval = Math.min(hard_interval, good_interval)
      good_interval = Math.max(good_interval, hard_interval + 1);
      easy_interval = Math.max(easy_interval, good_interval + 1);

      if (states.hard.normal?.review) {
        states.hard.normal.review.scheduledDays = hard_interval;
      }
      if (states.good.normal?.review) {
        states.good.normal.review.scheduledDays = good_interval;
      }
      if (states.easy.normal?.review) {
        states.easy.normal.review.scheduledDays = easy_interval;
      }
    }

    function constrain_difficulty(difficulty: number) {
      return Math.min(Math.max(difficulty.toFixed(2), 1), 10);
    }

    function apply_fuzz(ivl: number) {
      if (!enable_fuzz || ivl < 2.5) return ivl;
      ivl = Math.round(ivl);
      const min_ivl = Math.max(2, Math.round(ivl * 0.95 - 1));
      const max_ivl = Math.round(ivl * 1.05 + 1);
      return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl);
    }

    function next_interval(stability: number) {
      const new_interval = apply_fuzz(stability * intervalModifier);
      return Math.min(Math.max(Math.round(new_interval), 1), maximumInterval);
    }

    function next_difficulty(d: number, rating: keyof typeof ratings) {
      let next_d = d + w[4] * (ratings[rating] - 3);
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

    function init_states() {
      customData.again.d = init_difficulty("again");
      customData.again.s = init_stability("again");
      customData.hard.d = init_difficulty("hard");
      customData.hard.s = init_stability("hard");
      customData.good.d = init_difficulty("good");
      customData.good.s = init_stability("good");
      customData.easy.d = init_difficulty("easy");
      customData.easy.s = init_stability("easy");
    }

    function create_init_custom_data(): CustomData {
      return {
        again: {
          d: init_difficulty("again"),
          s: init_stability("again"),
        },
        hard: {
          d: init_difficulty("hard"),
          s: init_stability("hard"),
        },
        good: {
          d: init_difficulty("good"),
          s: init_stability("good"),
        },
        easy: {
          d: init_difficulty("easy"),
          s: init_stability("easy"),
        }
      }
    }

    function init_difficulty(rating: keyof typeof ratings) {
      return +constrain_difficulty(w[2] + w[3] * (ratings[rating] - 3)).toFixed(2);
    }

    function init_stability(rating: keyof typeof ratings) {
      return +Math.max(w[0] + w[1] * (ratings[rating] - 1), 0.1).toFixed(2);
    }

    function convert_states() {
      const scheduledDays = states.current.normal ? states.current.normal.review.scheduledDays : states.current.filtered.rescheduling.originalState.review.scheduledDays;
      const easeFactor = states.current.normal ? states.current.normal.review.easeFactor : states.current.filtered.rescheduling.originalState.review.easeFactor;
      const old_s = +Math.max(scheduledDays, 0.1).toFixed(2);
      const old_d = constrain_difficulty(11 - (easeFactor - 1) / (Math.exp(w[6]) * Math.pow(old_s, w[7]) * (Math.exp(0.1 * w[8]) - 1)))
        customData.again.d = old_d;
      customData.again.s = old_s;
      customData.hard.d = old_d;
      customData.hard.s = old_s;
      customData.good.d = old_d;
      customData.good.s = old_s;
      customData.easy.d = old_d;
      customData.easy.s = old_s;
    }

    function is_new() {
      return history.length == 0;
    }

    function is_learning() {
      // TODO: currentIvl >= learning threshhold && < review threshhold
      // return 
    }

    function is_review() {
      // TODO: currentIvl >= review threshhold?
      // return 
    }

    function is_empty() {
      return customData.again.d == null
        || customData.again.s == null
        || customData.hard.d == null
        || customData.hard.s == null
        || customData.good.d == null
        || customData.good.s == null
        || customData.easy.d == null 
        || customData.easy.s == null
    }
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);

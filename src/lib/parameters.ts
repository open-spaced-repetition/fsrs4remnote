import { SchedulerParam } from './consts';

export const defaultParameters = {
  [SchedulerParam.Weights]: {
    id: SchedulerParam.Weights,
    title: SchedulerParam.Weights,
    defaultValue: "1, 1, 5, -0.5, -0.5, 0.2, 1.4, -0.12, 0.8, 2, -0.2, 0.2, 1",
    description: "Weights created by running the FSRS optimizer. By default these are weights computed from a sample dataset. You can create weights tuned to your own knowledge base by running your repetition history through the FSRS optimizer.",
    type: 'string' as const,
    validators: [
      {
        type: "regex" as const,
        arg: '/^-?\d+\.?\d*(?:, -?\d+\.?\d*){12}$/',
      },
    ]
  },
  [SchedulerParam.Fuzz]: {
    id: SchedulerParam.Fuzz,
    title: SchedulerParam.Fuzz,
    defaultValue: true,
    description: "When enabled this adds a small random delay to new intervals to prevent cards from sticking together and always coming up for review on the same day.",
    type: 'boolean' as const,
  },
  [SchedulerParam.RequestRetention]: {
    id: SchedulerParam.RequestRetention,
    title: SchedulerParam.RequestRetention,
    defaultValue: 0.9,
    description: "Represents the probability of recall you want to target. Note that there is a tradeoff between higher retention and higher number of repetitions. It is recommended to set this value somewhere between 0.8 and 0.9.",
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
      {
        type: "lte" as const,
        arg: 1,
      }
    ]
  },
  [SchedulerParam.MaximumInterval]: {
    id: SchedulerParam.MaximumInterval,
    title: SchedulerParam.MaximumInterval,
    defaultValue: 36500,
    description: "The maximum number of days between repetitions.",
    type: 'number' as const,
    validators: [
      {
        type: "int" as const
      },
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.EasyBonus]: {
    id: SchedulerParam.EasyBonus,
    title: SchedulerParam.EasyBonus,
    defaultValue: 1.3,
    description: "An extra multiplier applied to the interval when a review card is answered Easy.",
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.HardInterval]: {
    id: SchedulerParam.HardInterval,
    title: SchedulerParam.HardInterval,
    defaultValue: 1.2,
    description: "",
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.AgainRating]: {
    id: SchedulerParam.AgainRating,
    title: SchedulerParam.AgainRating,
    defaultValue: 1,
    description: `The score used to calculate the next repetition invertal when you press the "Again" answer button`,
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.HardRating]: {
    id: SchedulerParam.HardRating,
    title: SchedulerParam.HardRating,
    defaultValue: 2,
    description: `The score used to calculate the next repetition invertal when you press the "Hard" answer button`,
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.GoodRating]: {
    id: SchedulerParam.GoodRating,
    title: SchedulerParam.GoodRating,
    defaultValue: 3,
    description: `The score used to calculate the next repetition invertal when you press the "Good" answer button`,
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.EasyRating]: {
    id: SchedulerParam.EasyRating,
    title: SchedulerParam.EasyRating,
    defaultValue: 4,
    description: `The score used to calculate the next repetition invertal when you press the "Easy" answer button`,
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  },
  [SchedulerParam.EasyRating]: {
    id: SchedulerParam.EasyRating,
    title: SchedulerParam.EasyRating,
    defaultValue: 4,
    description: `The score used to calculate the next repetition invertal when you press the "Easy" answer button`,
    type: 'number' as const,
    validators: [
      {
        type: "gte" as const,
        arg: 0,
      },
    ]
  }
};

type DefaultParameterRecord = typeof defaultParameters

export type SchedulerParameterTypes = {
  [Param in keyof typeof defaultParameters]: DefaultParameterRecord[Param]["defaultValue"]
}

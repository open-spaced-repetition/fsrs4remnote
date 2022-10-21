import {PluginSchedulerParameter} from "@remnote/plugin-sdk";
import {SchedulerParam} from './consts';

export const defaultParameters: PluginSchedulerParameter[] = [
  {
    id: SchedulerParam.Weights,
    title: SchedulerParam.Weights,
    defaultValue: "1, 1, 5, -0.5, -0.5, 0.2, 1.4, -0.12, 0.8, 2, -0.2, 0.2, 1",
    description: "Weights created by running the FSRS optimizer. By default these are weights computed from a sample dataset. You can create weights tuned to your own knowledge base by running your repetition history through the FSRS optimizer.",
    type: 'string',
  },
  {
    id: SchedulerParam.Fuzz,
    title: SchedulerParam.Fuzz,
    defaultValue: true,
    description: "When enabled this adds a small random delay to new intervals to prevent cards from sticking together and always coming up for review on the same day.",
    type: 'boolean',
  },
  {
    id: SchedulerParam.RequestRetention,
    title: SchedulerParam.RequestRetention,
    defaultValue: 0.9,
    description: "Represents the probability of recall you want to target. Note that there is a tradeoff between higher retention and higher number of repetitions. It is recommended to set this value somewhere between 0.8 and 0.9.",
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
      {
        type: "lte",
        arg: 1,
      }
    ]
  },
  {
    id: SchedulerParam.MaximumInterval,
    title: SchedulerParam.MaximumInterval,
    defaultValue: 36500,
    description: "The maximum number of days between repetitions.",
    type: 'number',
    validators: [
      {
        type: "int"
      },
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.EasyBonus,
    title: SchedulerParam.EasyBonus,
    defaultValue: 1.3,
    description: "An extra multiplier applied to the interval when a review card is answered Easy.",
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.HardInterval,
    title: SchedulerParam.HardInterval,
    defaultValue: 1.2,
    description: "",
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.AgainRating,
    title: SchedulerParam.AgainRating,
    defaultValue: 1,
    description: `The score used to calculate the next repetition invertal when you press the "Again" answer button`,
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.HardRating,
    title: SchedulerParam.HardRating,
    defaultValue: 2,
    description: `The score used to calculate the next repetition invertal when you press the "Hard" answer button`,
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.GoodRating,
    title: SchedulerParam.GoodRating,
    defaultValue: 3,
    description: `The score used to calculate the next repetition invertal when you press the "Good" answer button`,
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.EasyRating,
    title: SchedulerParam.EasyRating,
    defaultValue: 4,
    description: `The score used to calculate the next repetition invertal when you press the "Easy" answer button`,
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  },
  {
    id: SchedulerParam.EasyRating,
    title: SchedulerParam.EasyRating,
    defaultValue: 4,
    description: `The score used to calculate the next repetition invertal when you press the "Easy" answer button`,
    type: 'number',
    validators: [
      {
        type: "gte",
        arg: 0,
      },
    ]
  }
]

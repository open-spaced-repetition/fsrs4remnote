import { RepetitionStatus } from '@remnote/plugin-sdk';

export const validateCustomData = (r: RepetitionStatus) => {
  return (
    !!r.pluginData &&
    (r.pluginData as CustomData).stage != null &&
    (r.pluginData as CustomData).stability != null &&
    (r.pluginData as CustomData).lastReview != null &&
    (r.pluginData as CustomData).difficulty != null
  );
};

export enum Stage {
  New = 0,
  Learning,
  Review,
  Relearning,
}

export interface CustomData {
  difficulty: number;
  stability: number;
  stage: Stage;
  lastReview: number | Date;
}

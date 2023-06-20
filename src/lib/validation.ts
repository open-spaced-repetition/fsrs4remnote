import { RepetitionStatus } from '@remnote/plugin-sdk';

export const validateCustomData = (data: Record<string, any> | undefined): data is CustomData => {
  return (
    !!data &&
    (data as CustomData).stage != null &&
    (data as CustomData).stability != null &&
    (data as CustomData).lastReview != null &&
    (data as CustomData).difficulty != null
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

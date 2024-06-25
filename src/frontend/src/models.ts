export type ChatDebugDetails = {
  thoughts: string;
  dataPoints: string[];
};

export type ChatMessageContext = object & {
  thoughts?: string;
  data_points?: string[];
};

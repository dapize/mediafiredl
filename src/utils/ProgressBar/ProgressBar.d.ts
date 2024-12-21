export interface IProgressBarConfig {
  details?: boolean;
}

export interface IPayloadFormatBar {
  fileName: string;
  elapsed: string;
  percentage: number;
  value: string;
  total: string;
  speed: string;
  eta: string;
}

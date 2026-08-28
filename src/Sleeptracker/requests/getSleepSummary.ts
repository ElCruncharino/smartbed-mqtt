import { logError } from '@utils/logger';
import axios from 'axios';
import { Credentials } from '../options';
import { SleepSummary } from '../types/SleepSummary';
import { getAuthHeader } from './getAuthHeader';
import defaultHeaders from './shared/defaultHeaders';
import { buildDefaultPayload } from './shared/defaultPayload';
import { urls } from './shared/urls';

type Bucket = {
  startDayYYYYMMDD: string;
  hrAvg: number | null;
  rrAvg: number | null;
  breathingAnomalyIndex: number | null;
  totalSleepSecsAvg: number | null;
  totalAwakeSecsAvg: number | null;
  inBedSecsAvg: number | null;
  deepSleepSecsAvg: number | null;
  lightSleepSecsAvg: number | null;
  remSleepSecsAvg: number | null;
};

type Response = { buckets: Bucket[] };

const LOOKBACK_DAYS = 10;

const toYYYYMMDD = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toMins = (secs: number) => Math.round(secs / 60);

const mapBucket = (bucket: Bucket): SleepSummary => ({
  ...(bucket.hrAvg != null && { heartRateAvg: round(bucket.hrAvg, 1) }),
  ...(bucket.rrAvg != null && { respirationRateAvg: round(bucket.rrAvg, 1) }),
  ...(bucket.breathingAnomalyIndex != null && { breathingAnomalyIndex: round(bucket.breathingAnomalyIndex, 2) }),
  ...(bucket.totalSleepSecsAvg != null && { totalSleepMins: toMins(bucket.totalSleepSecsAvg) }),
  ...(bucket.totalAwakeSecsAvg != null && { totalAwakeMins: toMins(bucket.totalAwakeSecsAvg) }),
  ...(bucket.inBedSecsAvg != null && { timeInBedMins: toMins(bucket.inBedSecsAvg) }),
  ...(bucket.deepSleepSecsAvg != null && { deepSleepMins: toMins(bucket.deepSleepSecsAvg) }),
  ...(bucket.lightSleepSecsAvg != null && { lightSleepMins: toMins(bucket.lightSleepSecsAvg) }),
  ...(bucket.remSleepSecsAvg != null && { remSleepMins: toMins(bucket.remSleepSecsAvg) }),
});

export const getSleepSummary = async (credentials: Credentials): Promise<SleepSummary | null> => {
  const authHeader = await getAuthHeader(credentials);
  if (!authHeader) return null;

  const { appHost, fpcsiotBaseUrl } = urls(credentials);
  const end = new Date();
  const start = new Date(end.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  try {
    const response = await axios.request<Response>({
      method: 'POST',
      url: `${fpcsiotBaseUrl}/sleep/summarize`,
      headers: {
        ...defaultHeaders,
        Host: appHost,
        Authorization: authHeader,
      },
      data: {
        ...buildDefaultPayload('sleepSummarize', credentials),
        startDayYYYYMMDD: toYYYYMMDD(start),
        endDayYYYYMMDD: toYYYYMMDD(end),
        bucketPeriod: 1,
      },
    });

    const mostRecentCompleted = (response.data.buckets || [])
      .filter((bucket) => bucket.totalSleepSecsAvg != null)
      .sort((a, b) => (a.startDayYYYYMMDD < b.startDayYYYYMMDD ? 1 : -1))[0];

    return mostRecentCompleted ? mapBucket(mostRecentCompleted) : null;
  } catch (err) {
    logError(err);
    return null;
  }
};

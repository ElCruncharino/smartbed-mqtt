import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { BreathingAnomalyIndexSensor } from '../entities/SleepSummary/BreathingAnomalyIndexSensor';
import { DeepSleepSensor } from '../entities/SleepSummary/DeepSleepSensor';
import { HeartRateSensor } from '../entities/SleepSummary/HeartRateSensor';
import { LightSleepSensor } from '../entities/SleepSummary/LightSleepSensor';
import { RemSleepSensor } from '../entities/SleepSummary/RemSleepSensor';
import { RespirationRateSensor } from '../entities/SleepSummary/RespirationRateSensor';
import { TimeInBedSensor } from '../entities/SleepSummary/TimeInBedSensor';
import { TotalAwakeSensor } from '../entities/SleepSummary/TotalAwakeSensor';
import { TotalSleepSensor } from '../entities/SleepSummary/TotalSleepSensor';
import { getSleepSummary } from '../requests/getSleepSummary';
import { Bed } from '../types/Bed';
import { Controller } from '../types/Controller';

const FETCH_INTERVAL_MS = 60 * 60 * 1000;

interface Cache {
  sleepSummaryLastFetchMs?: number;
  heartRateAvg?: HeartRateSensor;
  respirationRateAvg?: RespirationRateSensor;
  breathingAnomalyIndex?: BreathingAnomalyIndexSensor;
  totalSleepMins?: TotalSleepSensor;
  totalAwakeMins?: TotalAwakeSensor;
  timeInBedMins?: TimeInBedSensor;
  deepSleepMins?: DeepSleepSensor;
  lightSleepMins?: LightSleepSensor;
  remSleepMins?: RemSleepSensor;
}

export const processSleepSummarySensors = async (
  mqtt: IMQTTConnection,
  { deviceData }: Bed,
  { user, sideName, entities }: Controller
) => {
  const cache = entities as Cache;
  const now = Date.now();
  if (cache.sleepSummaryLastFetchMs && now - cache.sleepSummaryLastFetchMs < FETCH_INTERVAL_MS) return;
  cache.sleepSummaryLastFetchMs = now;

  const summary = await getSleepSummary(user);
  if (!summary) return;

  if (summary.heartRateAvg !== undefined) {
    if (!cache.heartRateAvg) cache.heartRateAvg = new HeartRateSensor(mqtt, deviceData, sideName);
    cache.heartRateAvg.setState(summary.heartRateAvg);
  }
  if (summary.respirationRateAvg !== undefined) {
    if (!cache.respirationRateAvg) cache.respirationRateAvg = new RespirationRateSensor(mqtt, deviceData, sideName);
    cache.respirationRateAvg.setState(summary.respirationRateAvg);
  }
  if (summary.breathingAnomalyIndex !== undefined) {
    if (!cache.breathingAnomalyIndex)
      cache.breathingAnomalyIndex = new BreathingAnomalyIndexSensor(mqtt, deviceData, sideName);
    cache.breathingAnomalyIndex.setState(summary.breathingAnomalyIndex);
  }
  if (summary.totalSleepMins !== undefined) {
    if (!cache.totalSleepMins) cache.totalSleepMins = new TotalSleepSensor(mqtt, deviceData, sideName);
    cache.totalSleepMins.setState(summary.totalSleepMins);
  }
  if (summary.totalAwakeMins !== undefined) {
    if (!cache.totalAwakeMins) cache.totalAwakeMins = new TotalAwakeSensor(mqtt, deviceData, sideName);
    cache.totalAwakeMins.setState(summary.totalAwakeMins);
  }
  if (summary.timeInBedMins !== undefined) {
    if (!cache.timeInBedMins) cache.timeInBedMins = new TimeInBedSensor(mqtt, deviceData, sideName);
    cache.timeInBedMins.setState(summary.timeInBedMins);
  }
  if (summary.deepSleepMins !== undefined) {
    if (!cache.deepSleepMins) cache.deepSleepMins = new DeepSleepSensor(mqtt, deviceData, sideName);
    cache.deepSleepMins.setState(summary.deepSleepMins);
  }
  if (summary.lightSleepMins !== undefined) {
    if (!cache.lightSleepMins) cache.lightSleepMins = new LightSleepSensor(mqtt, deviceData, sideName);
    cache.lightSleepMins.setState(summary.lightSleepMins);
  }
  if (summary.remSleepMins !== undefined) {
    if (!cache.remSleepMins) cache.remSleepMins = new RemSleepSensor(mqtt, deviceData, sideName);
    cache.remSleepMins.setState(summary.remSleepMins);
  }
};

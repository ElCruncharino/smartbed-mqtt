import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { mocked, testDevice } from '@utils/testHelpers';
import { mock } from 'jest-mock-extended';
import { Bed } from 'Sleeptracker/types/Bed';
import { Controller } from 'Sleeptracker/types/Controller';
import { getSleepSummary } from '../requests/getSleepSummary';
import { processSleepSummarySensors } from './sleepSummarySensors';

jest.mock('../requests/getSleepSummary');

const mqtt = mock<IMQTTConnection>();
const bed = { deviceData: testDevice } as unknown as Bed;

const buildController = (): Controller => ({
  user: { email: 'email', password: 'password' },
  side: 0,
  sideName: '',
  entities: {},
  capability: {} as Controller['capability'],
});

const heartRateStateMessages = () =>
  mocked(mqtt.publish).mock.calls.filter(
    ([topic]) => typeof topic === 'string' && topic.includes('heart_rate') && topic.endsWith('/state')
  );

describe(processSleepSummarySensors.name, () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  beforeEach(jest.resetAllMocks);

  it('does not create any sensor when there is no completed sleep data yet', async () => {
    mocked(getSleepSummary).mockResolvedValue(null);

    await processSleepSummarySensors(mqtt, bed, buildController());
    jest.runAllTimers();

    expect(
      mocked(mqtt.publish).mock.calls.some(
        ([topic]) => typeof topic === 'string' && topic.startsWith('homeassistant/sensor/')
      )
    ).toBe(false);
  });

  it('only creates sensors for metrics present in the summary, skipping absent ones', async () => {
    mocked(getSleepSummary).mockResolvedValue({ heartRateAvg: 65.3, totalSleepMins: 462 });

    await processSleepSummarySensors(mqtt, bed, buildController());
    jest.runAllTimers();

    const discoveryTopics = mocked(mqtt.publish).mock.calls
      .map(([topic]) => topic)
      .filter((topic): topic is string => typeof topic === 'string' && topic.startsWith('homeassistant/sensor/'));

    expect(discoveryTopics.some((topic) => topic.includes('heart_rate'))).toBe(true);
    expect(discoveryTopics.some((topic) => topic.includes('total_sleep'))).toBe(true);
    // respiration rate, breathing anomaly index, etc. were absent from the mocked summary
    expect(discoveryTopics.some((topic) => topic.includes('respiration_rate'))).toBe(false);
  });

  it('throttles fetches to once per hour, then fetches again once the hour has passed', async () => {
    mocked(getSleepSummary).mockResolvedValue({ heartRateAvg: 60 });

    const controller = buildController();
    await processSleepSummarySensors(mqtt, bed, controller);
    expect(getSleepSummary).toHaveBeenCalledTimes(1);

    // well within the hour - should skip
    jest.advanceTimersByTime(30 * 60 * 1000);
    await processSleepSummarySensors(mqtt, bed, controller);
    expect(getSleepSummary).toHaveBeenCalledTimes(1);

    // past the hour - should fetch again
    jest.advanceTimersByTime(31 * 60 * 1000);
    await processSleepSummarySensors(mqtt, bed, controller);
    expect(getSleepSummary).toHaveBeenCalledTimes(2);
  });

  it('updates the same sensor instance on subsequent fetches rather than recreating it', async () => {
    mocked(getSleepSummary)
      .mockResolvedValueOnce({ heartRateAvg: 60 })
      .mockResolvedValueOnce({ heartRateAvg: 72 });

    const controller = buildController();
    await processSleepSummarySensors(mqtt, bed, controller);
    jest.runAllTimers();
    jest.advanceTimersByTime(61 * 60 * 1000);
    await processSleepSummarySensors(mqtt, bed, controller);
    jest.runAllTimers();

    const discoveryTopics = mocked(mqtt.publish).mock.calls.filter(
      ([topic]) => typeof topic === 'string' && topic.startsWith('homeassistant/sensor/') && topic.includes('heart_rate')
    );
    expect(discoveryTopics).toHaveLength(1);
    expect(heartRateStateMessages().at(-1)?.[1]).toBe(72);
  });
});

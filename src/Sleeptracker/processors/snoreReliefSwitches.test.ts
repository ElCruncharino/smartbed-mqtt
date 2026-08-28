import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { mocked, testDevice } from '@utils/testHelpers';
import { mock } from 'jest-mock-extended';
import { Bed } from 'Sleeptracker/types/Bed';
import { Controller } from 'Sleeptracker/types/Controller';
import { getSnoreRelief } from '../requests/getSnoreRelief';
import { setSnoreRelief } from '../requests/setSnoreRelief';
import { processSnoreReliefSwitches } from './snoreReliefSwitches';

jest.mock('../requests/getSnoreRelief');
jest.mock('../requests/setSnoreRelief');

const mqtt = mock<IMQTTConnection>();
const bed = { deviceData: testDevice } as unknown as Bed;

const buildController = (): Controller => ({
  user: { email: 'email', password: 'password' },
  side: 0,
  sideName: '',
  entities: {},
  capability: {} as Controller['capability'],
});

const commandHandlerFor = (topicSubstring: string) => {
  const call = mocked(mqtt.on).mock.calls.find(([topic]) => typeof topic === 'string' && topic.includes(topicSubstring));
  if (!call) throw new Error(`no mqtt.on registered for a topic containing "${topicSubstring}"`);
  return call[1] as (message: string) => Promise<void>;
};

describe(processSnoreReliefSwitches.name, () => {
  beforeAll(async () => {
    jest.useFakeTimers();
  });
  beforeEach(jest.resetAllMocks);

  it('does not create a switch set when the bed has no snore relief data', async () => {
    mocked(getSnoreRelief).mockResolvedValue(null);

    await processSnoreReliefSwitches(mqtt, bed, buildController());
    jest.runAllTimers();

    expect(
      mocked(mqtt.publish).mock.calls.some(
        ([topic]) => typeof topic === 'string' && topic.startsWith('homeassistant/switch/')
      )
    ).toBe(false);
  });

  it('toggling the tilt switch actually calls setSnoreRelief (regression: switchSet must be wired up, not left null)', async () => {
    mocked(getSnoreRelief)
      .mockResolvedValueOnce({ snoreReliefTilt: false, snoreReliefVibration: true })
      .mockResolvedValueOnce({ snoreReliefTilt: true, snoreReliefVibration: true });
    mocked(setSnoreRelief).mockResolvedValue(true);

    const controller = buildController();
    await processSnoreReliefSwitches(mqtt, bed, controller);
    jest.runAllTimers();

    const tiltCommandHandler = commandHandlerFor('snore_relief_tilt');
    await tiltCommandHandler('ON');
    jest.runAllTimers();

    // Pre-fix, the module-level `switchSet` was never assigned, so
    // handleSnoreReliefChange's `if (!switchSet) return;` guard fired first
    // and setSnoreRelief was never reached.
    expect(setSnoreRelief).toHaveBeenCalledWith(
      expect.objectContaining({ snoreReliefTilt: true, snoreReliefVibration: true }),
      controller.user
    );

    // The switch set should have picked up the fresh state from the second getSnoreRelief call.
    const tiltStateMessages = mocked(mqtt.publish).mock.calls.filter(
      ([topic]) => typeof topic === 'string' && topic.includes('snore_relief_tilt') && topic.endsWith('/state')
    );
    expect(tiltStateMessages.at(-1)?.[1]).toBe('ON');
  });
});

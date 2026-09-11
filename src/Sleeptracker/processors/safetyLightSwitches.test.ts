import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { mocked, testDevice } from '@utils/testHelpers';
import { mock } from 'jest-mock-extended';
import { Bed } from 'Sleeptracker/types/Bed';
import { Controller } from 'Sleeptracker/types/Controller';
import { Snapshot } from 'Sleeptracker/types/Snapshot';
import { sendAdjustableBaseCommand } from '../requests/sendAdjustableBaseCommand';
import { processSafetyLightSwitches } from './safetyLightSwitches';

jest.mock('../requests/sendAdjustableBaseCommand');

const mqtt = mock<IMQTTConnection>();
const bed = { deviceData: testDevice } as unknown as Bed;

const buildController = (): Controller => ({
  user: { email: 'email', password: 'password' },
  side: 0,
  sideName: '',
  entities: {},
  capability: {} as Controller['capability'],
});

const buildSnapshot = (safetyLightOn: boolean): Snapshot => ({
  cableTime: 0,
  foot: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  head: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  headTilt: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  lumbar: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  massagePattern: 0,
  massageTimerMins: 0,
  massageTimerSecs: 0,
  safetyLightOn,
  side: 0,
});

const commandHandler = () => {
  const call = mocked(mqtt.on).mock.calls.find(
    ([topic]) => typeof topic === 'string' && topic.includes('safety_lights')
  );
  if (!call) throw new Error('no mqtt.on registered for safety_lights');
  return call[1] as (message: string) => Promise<void>;
};

describe(processSafetyLightSwitches.name, () => {
  beforeEach(jest.resetAllMocks);

  it('sends only one toggle when two ON commands arrive before the first resolves (regression: closure-captured state race)', async () => {
    let resolveToggle: (value: unknown) => void = () => {};
    mocked(sendAdjustableBaseCommand).mockReturnValue(
      new Promise((resolve) => {
        resolveToggle = resolve;
      })
    );

    const controller = buildController();
    await processSafetyLightSwitches(mqtt, bed, controller, buildSnapshot(false));

    const handler = commandHandler();
    const first = handler('ON');
    const second = handler('ON');

    resolveToggle([{ side: 0, safetyLightOn: true }]);
    await Promise.all([first, second]);

    expect(sendAdjustableBaseCommand).toHaveBeenCalledTimes(1);
  });

  it('does not toggle when a later poll already reports the requested state', async () => {
    mocked(sendAdjustableBaseCommand).mockResolvedValue([{ side: 0, safetyLightOn: true }] as never);

    const controller = buildController();
    await processSafetyLightSwitches(mqtt, bed, controller, buildSnapshot(false));
    // A poll cycle observes the light is now on (e.g. toggled via the app), independent of this switch's own callback.
    await processSafetyLightSwitches(mqtt, bed, controller, buildSnapshot(true));

    await commandHandler()('ON');

    expect(sendAdjustableBaseCommand).not.toHaveBeenCalled();
  });
});

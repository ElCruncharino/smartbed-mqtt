import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { mocked, testDevice } from '@utils/testHelpers';
import { mock } from 'jest-mock-extended';
import { Bed } from 'Sleeptracker/types/Bed';
import { Controller } from 'Sleeptracker/types/Controller';
import { Snapshot } from 'Sleeptracker/types/Snapshot';
import { processLastActivitySensors } from './lastActivitySensors';

const mqtt = mock<IMQTTConnection>();
const bed = { deviceData: testDevice } as unknown as Bed;

const buildController = (): Controller => ({
  user: { email: 'email', password: 'password' },
  side: 0,
  sideName: '',
  entities: {},
  capability: {} as Controller['capability'],
});

const buildSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  cableTime: 0,
  foot: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  head: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  headTilt: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  lumbar: { massage: { active: false, strength: 0 }, motor: { pulseCount: 0 } },
  massagePattern: 0,
  massageTimerMins: 0,
  massageTimerSecs: 0,
  safetyLightOn: false,
  side: 0,
  ...overrides,
});

const stateMessagesFor = (topicSubstring: string) =>
  mocked(mqtt.publish).mock.calls.filter(
    ([topic]) => typeof topic === 'string' && topic.includes(topicSubstring) && topic.endsWith('/state')
  );

describe(processLastActivitySensors.name, () => {
  beforeAll(() => jest.useFakeTimers());
  beforeEach(jest.resetAllMocks);

  it('publishes both timestamps converted from epoch seconds to ISO 8601', async () => {
    await processLastActivitySensors(
      mqtt,
      bed,
      buildController(),
      buildSnapshot({ timeLastActuatorMovement: 1676790911, timeLastMassageActive: 1676791742 })
    );
    jest.runAllTimers();

    expect(stateMessagesFor('last_actuator_movement').at(-1)?.[1]).toBe(
      new Date(1676790911 * 1000).toISOString()
    );
    expect(stateMessagesFor('last_massage_active').at(-1)?.[1]).toBe(new Date(1676791742 * 1000).toISOString());
  });

  it('does not create an entity for a field the bed does not report', async () => {
    await processLastActivitySensors(mqtt, bed, buildController(), buildSnapshot({ timeLastActuatorMovement: 123 }));
    jest.runAllTimers();

    expect(stateMessagesFor('last_actuator_movement').length).toBeGreaterThan(0);
    expect(stateMessagesFor('last_massage_active').length).toBe(0);
  });
});

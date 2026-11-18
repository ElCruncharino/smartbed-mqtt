import { Credentials } from '../../options';
import { buildDefaultPayload } from './defaultPayload';

describe('buildDefaultPayload', () => {
  it('sends the Horizon app version string for tempur beds', () => {
    const credentials = { type: 'tempur' } as Credentials;
    expect(buildDefaultPayload('adjustableBaseControls', credentials)).toMatchObject({
      clientID: 'sleeptracker-android-tsi',
      clientVersion: 'H-3.6.2',
      id: 'TEST_ANDROID_adjustableBaseControls',
    });
  });
});

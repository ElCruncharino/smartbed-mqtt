import { Credentials, Type } from '../../options';

type Context =
  | 'session'
  | 'getByType'
  | 'hello'
  | 'getSensorMap'
  | 'latestEnvironmentSensorData'
  | 'setSnoreRelief'
  | 'adjustableBaseControls'
  | 'processorCommand'
  | 'sleepSummarize';

const contextMap = {
  session: 'getUserSession',
  getByType: 'cloudIoTDevicesGetByType',
  hello: 'cloudIoTProcessorSimpleHello',
  getSensorMap: 'cloudIoTDevicesGetSensorMap',
  latestEnvironmentSensorData: 'environmentalData',
  setSnoreRelief: 'setSnoreRelief',
  adjustableBaseControls: 'adjustableBaseControls',
  processorCommand: 'adjustableBaseControls',
  sleepSummarize: 'sleepDataSummaryBucket',
};

const getClientFields = (type?: Type) => {
  switch (type) {
    case 'beautyrest':
    case 'serta':
      return { clientID: 'sleeptracker-android', clientVersion: '6.5.15' };
    case 'tempur':
    default:
      // Official Horizon app (3.6.2) sends "H-" + its version as clientVersion.
      return { clientID: 'sleeptracker-android-tsi', clientVersion: 'H-3.6.2' };
  }
};
export const buildDefaultPayload = (context: Context, { type }: Credentials) => ({
  ...getClientFields(type),
  id: `TEST_ANDROID_${contextMap[context]}`,
});

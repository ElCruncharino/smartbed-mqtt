import { IDeviceData } from '@ha/IDeviceData';
import { Sensor } from '@ha/Sensor';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { buildEntityConfig } from 'Sleeptracker/buildEntityConfig';

export class HeartRateSensor extends Sensor<number> {
  constructor(mqtt: IMQTTConnection, deviceData: IDeviceData, sideName: string) {
    super(mqtt, deviceData, buildEntityConfig('Heart Rate', sideName));
  }

  discoveryState() {
    return {
      ...super.discoveryState(),
      state_class: 'measurement',
      unit_of_measurement: 'bpm',
    };
  }
}

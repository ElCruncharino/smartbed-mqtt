import { IDeviceData } from '@ha/IDeviceData';
import { Sensor } from '@ha/Sensor';
import { EntityConfig } from '@ha/base/Entity';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';

export class LastEventTimestampSensor extends Sensor<string> {
  constructor(mqtt: IMQTTConnection, deviceData: IDeviceData, config: EntityConfig) {
    super(mqtt, deviceData, config);
  }

  discoveryState() {
    return {
      ...super.discoveryState(),
      device_class: 'timestamp',
    };
  }

  setEpochSeconds(epochSeconds: number) {
    this.setState(new Date(epochSeconds * 1000).toISOString());
  }
}

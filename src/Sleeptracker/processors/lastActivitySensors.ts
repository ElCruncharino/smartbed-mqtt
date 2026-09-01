import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { buildEntityConfig } from 'Sleeptracker/buildEntityConfig';
import { LastEventTimestampSensor } from '../entities/LastEventTimestampSensor';
import { Bed } from '../types/Bed';
import { Controller } from '../types/Controller';
import { Snapshot } from '../types/Snapshot';

interface LastActivityEntities {
  lastActuatorMovement?: LastEventTimestampSensor;
  lastMassageActive?: LastEventTimestampSensor;
}

export const processLastActivitySensors = async (
  mqtt: IMQTTConnection,
  { deviceData }: Bed,
  { sideName, entities }: Controller,
  { timeLastActuatorMovement, timeLastMassageActive }: Snapshot
) => {
  const cache = entities as LastActivityEntities;

  if (timeLastActuatorMovement != null) {
    if (!cache.lastActuatorMovement) {
      cache.lastActuatorMovement = new LastEventTimestampSensor(
        mqtt,
        deviceData,
        buildEntityConfig('Last Actuator Movement', sideName, 'diagnostic')
      );
    }
    cache.lastActuatorMovement.setEpochSeconds(timeLastActuatorMovement);
  }

  if (timeLastMassageActive != null) {
    if (!cache.lastMassageActive) {
      cache.lastMassageActive = new LastEventTimestampSensor(
        mqtt,
        deviceData,
        buildEntityConfig('Last Massage Active', sideName, 'diagnostic')
      );
    }
    cache.lastMassageActive.setEpochSeconds(timeLastMassageActive);
  }
};

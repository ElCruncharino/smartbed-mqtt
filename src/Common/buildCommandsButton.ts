import { Button } from '@ha/Button';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import Strings, { StringsKey } from 'Strings/en';
import { logError } from '@utils/logger';
import { IController } from './IController';
import { buildEntityConfig } from './buildEntityConfig';

export const buildCommandsButton = <TCommand>(
  context: string,
  mqtt: IMQTTConnection,
  { cache, deviceData, writeCommands }: IController<TCommand>,
  name: StringsKey,
  commands: TCommand[],
  category?: string
) => {
  if (cache[name]) return;

  cache[name] = new Button(mqtt, deviceData, buildEntityConfig(name, category), async () => {
    try {
      await writeCommands(commands);
    } catch (e) {
      logError(`[${context}] Failed to write '${Strings[name]}'`, e);
    }
  }).setOnline();
};

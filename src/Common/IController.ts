import { IDeviceData } from '@ha/IDeviceData';

export interface IDeviceCache {
  cache: Record<string, unknown>;
  deviceData: IDeviceData;
}

export interface IController<TCommand> extends IDeviceCache {
  writeCommand: (command: TCommand, count?: number, waitTime?: number) => Promise<void>;
  writeCommands: (commands: TCommand[], count?: number, waitTime?: number) => Promise<void>;
  cancelCommands: () => Promise<void>;
}

import { Switch } from '@ha/Switch';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { buildEntityConfig } from 'Sleeptracker/buildEntityConfig';
import { sendAdjustableBaseCommand } from '../requests/sendAdjustableBaseCommand';
import { Bed } from '../types/Bed';
import { Commands } from '../types/Commands';
import { Controller } from '../types/Controller';
import { Snapshot } from '../types/Snapshot';

interface SafetyLightCache {
  safetyLightSwitch?: Switch;
  // The command is a toggle, not an explicit on/off, so knowing the current
  // state correctly matters: two toggles sent close together cancel out.
  // This must live on the shared cache (updated every poll) rather than be
  // captured once in the callback's closure - a closure-captured value never
  // learns about state changes from later polls or a concurrent command.
  safetyLightOn?: boolean;
  // A chain, not a single in-flight flag: each call appends its own decision
  // onto the end synchronously (before any await), so two calls arriving back
  // to back always serialize - the second one's "do we still need to toggle"
  // check runs after the first has actually updated safetyLightOn, instead of
  // both racing to check it at the same time and both deciding to toggle.
  togglePending?: Promise<void>;
}

export const processSafetyLightSwitches = async (
  mqtt: IMQTTConnection,
  { deviceData }: Bed,
  { sideName, entities, user }: Controller,
  { side, safetyLightOn }: Snapshot
) => {
  const cache = entities as SafetyLightCache;
  if (!cache.safetyLightSwitch) {
    cache.safetyLightSwitch = new Switch(mqtt, deviceData, buildEntityConfig('Safety Lights', sideName), async (state: boolean) => {
      const thisCall = (cache.togglePending ?? Promise.resolve()).then(async () => {
        if (cache.safetyLightOn === state) return;
        const results = await sendAdjustableBaseCommand(Commands.ToggleSafetyLights, user);
        const snapshot = results.find((r) => r.side === side);
        if (snapshot) cache.safetyLightOn = snapshot.safetyLightOn;
      });
      cache.togglePending = thisCall;
      await thisCall;
      return cache.safetyLightOn;
    });
  }
  cache.safetyLightOn = safetyLightOn;
  cache.safetyLightSwitch.setState(safetyLightOn);
};

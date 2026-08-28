import { joinNonEmpty } from './joinNonEmpty';

export const cleanJsonState = (
  state: Record<string, any> | undefined,
  fieldsToStrip = [] as string[],
  parentKey = ''
): Record<string, any> | null => {
  if (!state) return parentKey === '' ? {} : null;

  return Object.entries(state).reduce((acc, entry) => {
    handleEntry(acc, entry, fieldsToStrip, parentKey, state);
    return acc;
  }, {} as Record<string, any>);
};

const isoDateString = (value: number) => new Date(value * 1000).toISOString();

const handleEntry = (
  acc: Record<string, any>,
  [key, value]: [key: string, value: any],
  fieldsToStrip: string[],
  parentKey: string,
  state: Record<string, any> | undefined
) => {
  const fqKey = joinNonEmpty('.', parentKey, key);
  if (key.endsWith('GmtString') || fieldsToStrip.includes(key) || fieldsToStrip.includes(fqKey)) return;
  else if (key.endsWith('GMTSecs')) {
    key = key.substring(0, key.length - 7);
    value = isoDateString(value);
  } else if (key.endsWith('Gmt')) {
    key = key.substring(0, key.length - 3);
    value = isoDateString(value);
  } else if (key.startsWith('gmt') && typeof value === 'number' && value > 0) {
    key = key[3].toLowerCase() + key.substring(4);
    value = isoDateString(value);
  } else if (key.startsWith('time') && typeof value === 'number' && value > 0) {
    key = key[4].toLowerCase() + key.substring(5);
    value = isoDateString(value);
  } else if (key === 'localTimeNow' && state) {
    const offset = state['gmtOffset'] / 36;
    value = isoDateString(value).replace(
      'Z',
      offset.toLocaleString('en-US', { style: 'decimal', minimumIntegerDigits: 4, useGrouping: false })
    );
  } else if (key === 'cableTime') {
    value = isoDateString(value);
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      value = value.map((v) => (typeof v === 'object' ? cleanJsonState(v, fieldsToStrip, fqKey) : v));
    } else {
      value = cleanJsonState(value, fieldsToStrip, fqKey);
    }
  }
  acc[key] = value;
};

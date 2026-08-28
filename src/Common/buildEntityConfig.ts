import Strings, { StringsKey } from 'Strings/en';

export const buildEntityConfig = (
  key: StringsKey,
  additionalConfig?: string | { category?: string; icon?: string }
) => {
  if (typeof additionalConfig === 'string') additionalConfig = { category: additionalConfig };
  return {
    description: Strings[key],
    ...(additionalConfig || {}),
  };
};


export const buildDictionary = <TItem, TValue>(
  items: TItem[],
  mapper: (item: TItem) => { key: string; value: TValue }
) => {
  return items.reduce((acc, item) => {
    const { key, value } = mapper(item);
    acc[key] = value;
    return acc;
  }, {} as Record<string, TValue>);
};

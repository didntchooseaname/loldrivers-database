import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

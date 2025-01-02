// about this:  https://github.com/astoilkov/use-local-storage-state/issues/33#issuecomment-1528174484

import useLocalStorageState from "use-local-storage-state";

const _noSerializer = {
  stringify: (s) => s,
  parse: (s) => s,
};

export function useLocalStorageString(key): [string, (value: string) => void] {
  const [value, setValue] = useLocalStorageState(key, {
    serializer: _noSerializer,
  });
  return [value as string, setValue];
}

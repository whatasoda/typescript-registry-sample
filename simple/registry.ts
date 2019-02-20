interface RegistryRecord<TMap extends MapObject> {
  keyList: Array<Extract<keyof TMap, string>>;
  mapObject: TMap;
}

interface MapObject {
  [key: string]: any;
}

const createRegistry = <TAllKey extends string = string>() => {
  const mapObj: MapObject = {};

  let memo: object | null = null;
  const next = <TMap extends MapObject = {}>() => {
    if (memo !== null) {
      return memo as typeof PAYLOAD;
    }

    type UsedKey = Extract<keyof TMap, string>;
    type UnusedKey = Exclude<TAllKey, UsedKey>;
    const register = <TKey extends UnusedKey, TValue>(key: TKey, value: TValue) => {
      mapObj[key] = value;

      return next<TMap & { [_ in TKey]: TValue }>();
    };

    type RR = RegistryRecord<{ [K in keyof TMap]: TMap[K] }>;
    const publish = (): RR => {
      const keyList = Object.keys(mapObj) as RR['keyList'];
      const mapObject = mapObj as RR['mapObject'];

      return { keyList, mapObject };
    };

    const PAYLOAD = (memo = { register, publish });
    return PAYLOAD;
  };

  return next();
};

export default createRegistry;

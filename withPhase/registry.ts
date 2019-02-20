interface RegistryRecord<TMapC extends MapObject, TMapA extends MapObject> {
  keyList: Array<Extract<keyof TMapC, string>>;
  charactorMap: TMapC;
  actorMap: TMapA;
}

interface MapObject {
  [key: string]: any;
}

const createRegistry = <TAllKey extends string = string>() => {
  const mapObjC: MapObject = {};
  const mapObjA: MapObject = {};

  let memo: object | null = null;
  const next = <TMapC extends MapObject = {}, TMapA extends MapObject = {}>() => {
    if (memo !== null) {
      return memo as typeof PAYLOAD;
    }

    const init = () => {
      const { registerCharactorName, freezeCharactorName } = next<TMapC, TMapA>();
      return { registerCharactorName, freezeCharactorName };
    };

    type UsedKey = Extract<keyof TMapC, string>;
    type UnusedKey = Exclude<TAllKey, UsedKey>;
    const registerCharactorName = <TKey extends UnusedKey>(key: TKey, value: string) => {
      mapObjC[key] = value;

      const { registerCharactorName, freezeCharactorName } = next<TMapC & { [_ in TKey]: string }, TMapA>();
      return { registerCharactorName, freezeCharactorName };
    };

    const freezeCharactorName = () => {
      const { registerActorName, publish } = next<TMapC, TMapA>();
      return { registerActorName, publish };
    };

    const registerActorName = <TKey extends UsedKey>(key: TKey, value: string) => {
      mapObjA[key] = value;

      const { registerActorName, publish } = next<TMapC, TMapA & { [_ in TKey]: string }>();
      return { registerActorName, publish };
    };

    type RR = RegistryRecord<{ [K in keyof TMapC]: TMapC[K] }, { [K in keyof TMapA]: TMapA[K] }>;
    const publish = (): RR => {
      const keyList = Object.keys(mapObjC) as RR['keyList'];
      const charactorMap = mapObjC as RR['charactorMap'];
      const actorMap = mapObjA as RR['actorMap'];

      return { keyList, charactorMap, actorMap };
    };

    const PAYLOAD = (memo = {
      init,
      registerCharactorName,
      freezeCharactorName,
      registerActorName,
      publish,
    });
    return PAYLOAD;
  };

  return next().init();
};

export default createRegistry;

# TypeScriptで型も一緒にregisterできるregistryを実装しよう。

## 背景
- reduxとかの実装をするときに毎回同じフォーマットの型を書き続けるのは嫌。
- 型書かなくても読めば自明、でも書かないとTSに怒られるような型とかだと実際の実装をしているコードの邪魔になって嫌。
- 型推論を良しなにやってくれる状態で実際の実装したいけど、これまた何度も書くのは嫌。

## やってみた
今回書いたコードはここにおいてあります。
https://github.com/whatasoda/typescript-registry-sample

全体像
```ts
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
    const register = <TKey extends UnusedKey>(key: TKey, value: string) => {
      mapObj[key] = value;

      return next<TMap & { [_ in TKey]: string }>();
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
```

全部解説するとしんどいので、重要なところだけ。
### `next`
```ts
const next = <TMap extends MapObject = {}>() => {
```
`next`についている`TMap`というGenericsが実際に型をregisterしていってる部分になります。この`next`は型及び値を登録するための`register`や登録後に実際に使えるものを得るための`publish`といった関数を含むオブジェクトを返します。少し後に説明する通りこの`next`は`register`を呼び出す度に呼び出されます。その度に新しい`register`や`publish`を返すのは良くないので、memo化します。
```ts
let memo: object | null = null;
const next = <TMap extends MapObject = {}>() => {
  if (memo !== null) {
    return memo as typeof PAYLOAD;
  }

...

  const PAYLOAD = (memo = { register, publish });
  return PAYLOAD;
};
```
まず、型は気にせず実際の挙動を確認しましょう。

- 最初に`next`が呼び出されたとき、`memo`は`null`なのでif節はスルーされます。
- `register`や`publish`をつくります。
- 返り値として`PAYLOAD`を作り、同時にそれを`memo`にも割り当てます。
- `PAYLOAD`を返します。
- 2回目以降の`next`の呼び出しでは、`memo`に初回の`PAYLOAD`の値が入っているため`null`ではありません。そのためif節に入り、`memo`を返します。

2回目以降の`next`の呼び出しで返されるのは初回呼び出しで作られた`PAYLOAD`そのものです。`PAYLOAD`の型はGenericsの中身に依存するので、型の違いはあります。しかしTypeScriptの型は挙動に影響を与えないので問題ないでしょう。

もう書いてあるので分かるかとは思いますが、ただmemoを返すだけではTypeScriptは`next`の返り値の型を`typeof PAYLOAD | object | null`と解釈してしまいます。（便宜上`typeof PAYLOAD`という表記をしました。）これでは型のregisterなんて夢のまた夢なので、`memo`の型を`typeof PAYLOAD`にキャストします。
```ts
return memo as typeof PAYLOAD;
```
`memo`の型をキャストせずに`interface`なり`class`なりで定義してしまえと思うかもしれませんが、`interface`で定義すると結局`register`などを書くときに全く同じ型を書かねばなりませんし、全く同じ型にするために小さな型の嘘をたくさん生みかねません。やってみましたが非常に見づらかったです。`class`の場合はまだマシですが、registryが一つでいいよ！というときにはtoo much感が出ます。それにどのみち型のキャストが必要なのですが、キャストする部分の記述が長くなってしまいがちでこれまた見づらかったです。

今回`memo`の型は`object | null`ですが、結局は`typeof PAYLOAD`にキャストされる運命にあるため`any`でも良いです。むしろ`any`のほうが`memo`の型が尊重されてない感がでて良いかもしれませんね。

### `register`
```ts
type UsedKey = Extract<keyof TMap, string>;
type UnusedKey = Exclude<TAllKey, UsedKey>;
const register = <TKey extends UnusedKey>(key: TKey, value: string) => {
  mapObj[key] = value;

  return next<TMap & { [_ in TKey]: string }>();
};
```
ここで実際に型や値の登録をしていきます。値の登録に使っている`mapObj`は`next`の外側にクロージャで定義しています。型の登録は登録後の`TMap`の型を書いて行います。型の書き方にはいろいろあります。今回はIntersection Typesを使っていますが、reduxのactionを登録していくだけならUnion Typesでも事足りると思います。

`UsedKey`や`UnusedKey`などの型がここで定義されていますが、このようにコードを綺麗にするためのType Aliasを見やすい場所に型パラメーター無しで定義できるのもこの実装法で嬉しい点だと思います。先の`memo`の型のキャストの際に挙がった`interface`や`class`での実装ではここまでシンプルに書くのは厳しいと思います。

### `publish`
```ts
type RR = RegistryRecord<{ [K in keyof TMap]: TMap[K] }>;
const publish = (): RR => {
  const keyList = Object.keys(mapObj) as RR['keyList'];
  const mapObject = mapObj as RR['mapObject'];

  return { keyList, mapObject };
};
```
ここでは登録された値や型を元に実際に使う関数やオブジェクト達を定義していきます。今回は単純なものにしていますが、実際に自分がやった例だとreduxの`reducer`を定義するときに「書くときの`action`の型は`AnyAction`じゃ嫌だけど使うときには`AnyAction`が良い」みたいなことを実現するための関数を作ったりしました。

```ts
type RR = RegistryRecord<{ [K in keyof TMap]: TMap[K] }>;
```
余談ですが、これ、`TMap`入れるだけで良くない？と思うかもしれませんが、エラーやらなんやらで下記の1行目のようになるのを防いで、2行目の表示にしてくれるので使っています。参考までに。
```
Property 'Tippy' does not exist on type '{ Hoto: string; } & { Kafu: string; } & { Tedeza: string; } & { Uzimatsu: string; } & { Kirima: string; }'.
Property 'Tippy' does not exist on type '{ Hoto: string; Kafu: string; Tedeza: string; Uzimatsu: string; Kirima: string; }'.
```

特に解説はしませんが、実際にこれを使った物をおいておきます。repoにあるものと同じです。
```ts
import createRegistry from './registry';

const record = createRegistry<'Hoto' | 'Kafu' | 'Tedeza' | 'Uzimatsu' | 'Kirima'>()
  .register('Hoto', 'Cocoa')
  // .register('Tippy', 'Golden Flowery Orange Peco') /* Argument of type '"Tippy"' is not assignable to parameter of type '"Kafu" | "Tedeza" | "Uzimatsu" | "Kirima"'. */
  .register('Kafu', 'Chino')
  // .register('Kafu', 'Inori') /* Argument of type '"Kafu"' is not assignable to parameter of type '"Tedeza" | "Uzimatsu" | "Kirima"'. */
  .register('Tedeza', 'Rize')
  .register('Uzimatsu', 'Chiya')
  .register('Kirima', 'Sharo')
  // .register('Kafu', 'Inori') /* Argument of type '"Kafu"' is not assignable to parameter of type 'never'. */
  .publish();

console.log(record.keyList);
console.log(record.mapObject.Hoto);
console.log(record.mapObject.Kafu);
console.log(record.mapObject.Tedeza);
console.log(record.mapObject.Uzimatsu);
console.log(record.mapObject.Kirima);
// console.log(record.mapObject.Tippy); /* Property 'Tippy' does not exist on type '{ Hoto: string; Kafu: string; Tedeza: string; Uzimatsu: string; Kirima: string; }'. */
```

## 発展形の話
今回紹介したものでは`next()`をそのまま返していますが、次に使用して良いものだけを選んで返すことで、条件を満たした場合にのみ次のフェーズに進めるようなregistryを作ることが可能です。
prefixやsuffixを登録してから値の登録をしたいときや、`action`の登録と`actionCreator`の登録を別のファイルでやりたいときなどに役立つと思います。
長くなってきたので少しコードを載せる程度にします。詳しくはrepo内のコードを読んでみてください。
```ts
const createRegistry = <TAllKey extends string = string>() => {

...

  let memo: object | null = null;
  const next = <TMapC extends MapObject = {}, TMapA extends MapObject = {}>() => {
    if (memo !== null) {
      return memo as typeof PAYLOAD;
    }

    const init = () => {
      const { registerCharactorName, freezeCharactorName } = next<TMapC, TMapA>();
      return { registerCharactorName, freezeCharactorName };
    };

...

    const freezeCharactorName = () => {
      const { registerActorName, publish } = next<TMapC, TMapA>();
      return { registerActorName, publish };
    };

...

    return PAYLOAD;
  };

  return next().init();
};
```

## まとめ
嫌だったことを解決するためによりヘビーな型を書くことになった気がしますが、嫌だったことは解決して見通しがよくなったと感じているので良いこととします。

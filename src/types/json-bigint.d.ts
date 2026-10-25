declare module 'json-bigint' {
  export interface JSONBigIntOptions {
    storeAsString?: boolean
    alwaysParseAsBig?: boolean
    useNativeBigInt?: boolean
    protoAction?: 'error' | 'ignore' | 'preserve'
    constructorAction?: 'error' | 'ignore' | 'preserve'
  }

  export interface JSONBigInt {
    parse(text: string): any
    stringify(value: any, ...args: any[]): string
  }

  export default function JSONBig(options?: JSONBigIntOptions): JSONBigInt
}

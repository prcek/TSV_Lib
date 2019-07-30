export type Maybe<T> = null | T;

export type OrUndefined<Base> = { [Key in keyof Base]?: 
    Base[Key]}

export type OmitProp<Base,O> =  {
    [Key in Exclude<keyof Base,O>]: 
    Base[Key]
}
export type OmitProps<Base,O> =  {
    [Key in Exclude<keyof Base, keyof O>]: 
    Base[Key]
}
export type OmitId<Base> = OmitProp<Base,'_id'>;

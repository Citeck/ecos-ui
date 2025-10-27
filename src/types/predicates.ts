export type PredicateValueType = PredicateType | PredicateType[] | string | string[] | number | number[] | boolean | boolean[] | null;

export type PredicateType = {
  a?: string;
  att?: string;
  v?: PredicateValueType;
  val?: PredicateValueType;
  t?: string;
};

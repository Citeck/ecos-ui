export type Scalar = Array<Scalar> | string | number | boolean | null | undefined | object | Date;

export type AttributeLike = {
  getValue(scalar?: string | null, isMultiple?: boolean, withLoading?: boolean, forceReload?: boolean): any | Promise<any>;
  isPersisted(): boolean;
  getNewValueAttName(): string;
  getNewValueInnerAtt(): Scalar;
  isReadyToSave(): boolean;
  getPersistedValue?: (...args: any[]) => any;
  setPersistedValue?: (...args: any[]) => any;
  setValue?: (scalar: Scalar, value: Scalar) => any;
};

export type RecordWatcherLike = {
  getWatchedAttributes(): AttributesType;
  getAttributes(): any;
  setAttributes(atts: AttributesType): void;
  callCallback(): void;
};

export type AttributesType = string | string[] | Record<string, string>;

export type PreProcessAttsType = {
  clientAtts: Record<string, string>;
  config: {
    attsToEncryptIndexes: number[];
    attsToEncryptNames: string[];
  };
} | null;

export type PreProcessAttsToLoadWithClientType = {
  attsAliases: string[];
  attsToLoad: string[];
  attsToLoadLengthWithoutClient: number;
  isSingleAttribute: boolean;
  clientData: PreProcessAttsType;
};

export type RequestRecordType = {
  id: string;
  attributes: Record<string, AttributeLike>;
};

export type ParseAttributeType = { name: string; scalar: string | null; isMultiple: boolean } | null;

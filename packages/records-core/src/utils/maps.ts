interface BooleanValueMap {
  input: string;
  output: boolean;
  strict?: boolean;
}

export const MapBooleanValues: BooleanValueMap[] = [
  {
    input: 'да',
    output: true
  },
  {
    input: 'yes',
    output: true
  },
  {
    strict: true,
    input: 'true',
    output: true
  },
  {
    input: 'нет',
    output: false
  },
  {
    input: 'no',
    output: false
  },
  {
    strict: true,
    input: 'false',
    output: false
  }
];

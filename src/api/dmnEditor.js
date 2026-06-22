import Records from '@citeck/records-core';

export class DmnEditorApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str', true);
  };
}

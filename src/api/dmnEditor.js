import Records from '../components/Records';

export class DmnEditorApi {
  getDefinition = record => {
    return Records.get(record).load('definition?str', true);
  };
}

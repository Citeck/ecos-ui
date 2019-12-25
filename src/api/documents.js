import Records from '../components/Records';

export class DocumentsApi {
  getDocumentTypes = () => {
    return Records.query(
      {
        sourceId: 'emodel/type'
      },
      {
        name: 'name',
        parent: 'parent?id'
      }
    ).then(response => response);
  };
}

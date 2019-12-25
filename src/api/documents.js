import Records from '../components/Records';

export class DocumentsApi extends Records {
  getDocumentTypes = () => {
    return this.query(
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

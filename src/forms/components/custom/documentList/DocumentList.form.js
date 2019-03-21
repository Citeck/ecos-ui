import baseEditForm from 'formiojs/components/base/Base.form';
import DocumentListEditDisplay from './editForm/DocumentList.edit.display';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: DocumentListEditDisplay
      }
    ],
    ...extend
  );
}

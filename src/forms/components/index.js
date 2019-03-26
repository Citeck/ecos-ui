// import CheckList from './custom/checklist/CheckList';
// import DocumentList from './custom/documentList/DocumentList';
// import DateTime from './custom/datetime/DateTime';
import SelectJournal from './custom/selectJournal/SelectJournal';
import SelectJournalEditor from './custom/selectJournal/SelectJournal.form';

import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

SelectJournal.editForm = SelectJournalEditor;

Components.setComponents({
  ...DefaultComponents,
  selectJournal: SelectJournal
});

import components from '.';
import CheckListForm from './custom/checklist/CheckList.form';
import DocumentListForm from './custom/documentList/DocumentList.form';
import DateTime from './custom/datetime/DateTime.form';

components.checklist.editForm = CheckListForm;
components.documentList.editForm = DocumentListForm;
components.reactDatetime.editForm = DateTime;

export default components;

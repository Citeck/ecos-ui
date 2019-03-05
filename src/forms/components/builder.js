import CheckListForm from './custom/checklist/CheckList.form';
import DocumentListForm from './custom/documentList/DocumentList.form';
import DateTime from './custom/datetime/DateTime.form';
import SelectJournal from './custom/selectJournal/SelectJournal.form';

const componentsFormMap = {
  checklist: CheckListForm,
  documentList: DocumentListForm,
  reactDatetime: DateTime,
  selectJournal: SelectJournal
};

export function linkEditForms(componentList) {
  for (let componentName in componentList) {
    if (!componentList.hasOwnProperty(componentName)) {
      continue;
    }

    if (componentsFormMap.hasOwnProperty(componentName)) {
      componentList[componentName].editForm = componentsFormMap[componentName];
    }
  }
}

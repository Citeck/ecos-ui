import get from 'lodash/get';

import ModelEditor from '../ModelEditor';

import DMNModeler from '@/components/ModelEditor/DMNModeler';
import { SourcesId } from '@/constants';
import { EventListeners } from '@/constants/cmmn';
import { DMN_KEY_FIELDS } from '@/constants/dmn';

class DMNEditorPage extends ModelEditor {
  static modelType = 'dmn';

  initModeler = () => {
    this.designer = new DMNModeler();
  };

  get formTitle() {
    const type = get(this.state, 'selectedElement.$type') || get(this.state, 'selectedElement.type') || '';
    const [, sourceTypeValue] = type.split(':');

    return this.formType ? sourceTypeValue : null;
  }

  get formId() {
    return this.formType ? `${SourcesId.FORM}@dmn-type-${this.formType}` : null;
  }

  get keyFields() {
    return DMN_KEY_FIELDS;
  }

  getElement(element = {}) {
    const modeler = this.designer.modeler;
    if (!modeler) {
      return;
    }

    const activeViewer = modeler.getActiveViewer();
    const activeView = modeler.getActiveView();

    if (!activeViewer || activeView !== 'drd') {
      return;
    }

    return activeViewer.get('elementRegistry').get(element.id);
  }

  getFormType(selectedElement) {
    const elementType = selectedElement.$type || selectedElement.type;

    return elementType ? `${SourcesId.FORM}@dmn-type-${elementType}` : null;
  }

  get extraEvents() {
    const { setIsTableView } = this.props;

    const parents = super.extraEvents;

    return {
      ...parents,
      [EventListeners.VIEWS_CHANGED]: (e) => {
        const activeView = e.activeView;
        setIsTableView(activeView.type !== 'drd');
      },
    };
  }

  _getBusinessObjectByDiagramElement(element) {
    return element;
  }
}

export default DMNEditorPage;

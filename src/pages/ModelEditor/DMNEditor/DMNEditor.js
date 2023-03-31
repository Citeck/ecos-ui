import { getName } from 'dmn-js-shared/lib/util/ModelUtil';

import DMNModeler from '../../../components/ModelEditor/DMNModeler';
import { EventListeners } from '../../../constants/cmmn';
import ModelEditor from '../ModelEditor';
import { SourcesId } from '../../../constants';

class DMNEditorPage extends ModelEditor {
  static modelType = 'dmn';

  initModeler = () => {
    this.designer = new DMNModeler();
  };

  get formTitle() {
    return this.formType ? getName(this.state.selectedElement) : null;
  }

  get formId() {
    return this.formType ? `${SourcesId.FORM}@dmn-type-${this.formType}` : null;
  }

  getElement(element = {}) {
    const modeler = this.designer.modeler;
    if (!modeler) {
      return;
    }

    const activeViewer = modeler.getActiveViewer();
    if (!activeViewer) {
      return;
    }

    return activeViewer.get('elementRegistry').get(element.id);
  }

  getFormType(selectedElement) {
    const elementType = selectedElement.$type || selectedElement.type;

    return elementType ? `${SourcesId.FORM}@dmn-type-${elementType}` : null;
  }

  get extraEvents() {
    const { setIsAnyConfigButtonHidden } = this.props;

    const parents = super.extraEvents;

    return {
      ...parents,
      [EventListeners.VIEWS_CHANGED]: e => {
        const activeView = e.activeView;
        setIsAnyConfigButtonHidden(activeView.type !== 'drd');
      }
    };
  }

  _getBusinessObjectByDiagramElement(element) {
    return element;
  }
}

export default DMNEditorPage;

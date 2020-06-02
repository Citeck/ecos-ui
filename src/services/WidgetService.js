import ReactDOM from 'react-dom';
import React from 'react';

import Modal from '../components/common/EcosModal/CiteckEcosModal';
import { UploadNewVersion } from '../components/formAction';
import { DocPreview } from '../components/widgets/DocPreview';
import { t } from '../helpers/util';

export default class WidgetService {
  static uploadNewVersion(params = {}) {
    const { record, onClose } = params;
    const container = document.createElement('div');

    const onCloseModal = done => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      onClose && onClose(done);
    };

    ReactDOM.render(<UploadNewVersion record={record} onClose={onCloseModal} />, container);
    document.body.appendChild(container);
  }

  static openPreviewModal(params = {}) {
    const { recordId, title = 'doc-preview.modal.title' } = params;
    const modal = new Modal();

    modal.open(<DocPreview height={'100%'} scale={1} recordId={recordId} className="ecos-modal-preview-doc__content" />, {
      title: t(title),
      class: 'ecos-modal-preview-doc'
    });
  }
}

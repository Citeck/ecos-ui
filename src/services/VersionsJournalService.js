import ReactDOM from 'react-dom';
import React from 'react';
import get from 'lodash/get';
import set from 'lodash/set';

import { UploadNewVersion } from '../components/formAction';

class VersionsJournalService {
  static addVersion(params = {}) {
    const { record, onClose } = params;
    const container = document.createElement('div');

    const onCloseModal = done => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      onClose(done);
    };

    ReactDOM.render(<UploadNewVersion record={record} onClose={onCloseModal} />, container);

    document.body.appendChild(container);
  }
}

const versionsJournalService = get(window, 'Citeck.VersionsJournalService', VersionsJournalService);

set(window, 'Citeck.VersionsJournalService', versionsJournalService);

export default versionsJournalService;

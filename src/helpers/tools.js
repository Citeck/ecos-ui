import DialogManager from '../components/common/dialogs/Manager';
import JSONPretty from 'react-json-pretty';
import React from 'react';

export function showModalJson(data, title = 'Configuration') {
  DialogManager.showCustomDialog({
    title,
    modalClass: 'ecos-modal_width-lg',
    body: (
      <div style={{ overflow: 'auto', maxHeight: '85vh' }}>
        <JSONPretty data={data} />
      </div>
    )
  });
}

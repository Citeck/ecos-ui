import React from 'react';

import { t } from '../../helpers/util';
import { DocPreview } from '../widgets/DocPreview';
import { Btn } from '../common/btns';

import './style.scss';

const Labels = {
  BTN_CANCEL: 'business-process-viewer.button.cancel-bp'
};

export default class BusinessProcessViewer extends React.Component {
  handleCancelBP = () => {
    const { recordId, onCancel } = this.props;

    onCancel && onCancel(recordId);
  };

  render() {
    const { recordId } = this.props;

    return (
      <div className="ecos-business-process">
        <div className="ecos-business-process__content">
          <DocPreview height={'100%'} scale={1} recordId={recordId} noIndents />
        </div>
        <div className="ecos-business-process__actions">
          <Btn onClick={this.handleCancelBP}>{t(Labels.BTN_CANCEL)}</Btn>
        </div>
      </div>
    );
  }
}

import React from 'react';
import PropTypes from 'prop-types';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';
import { Labels } from '../../helpers/timesheet/constants';

import './style.scss';

class EventHistoryModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
  };

  onClose = () => {
    this.props.onClose && this.props.onClose();
  };

  render() {
    const { onClose, isOpen } = this.props;

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-xs"
        isBigHeader={true}
        title={t(Labels.EVENT_HISTORY_TITLE)}
        isOpen={isOpen}
        hideModal={onClose}
      >
        In progress
      </EcosModal>
    );
  }
}

export default EventHistoryModal;

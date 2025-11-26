import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EcosModal from '../common/EcosModal';
import { isMobileDevice, t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import CommonTimesheetService from '../../services/timesheet/common';
import { EventsHistory } from '../widgets/EventsHistory';

import './style.scss';

class EventHistoryModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    record: PropTypes.string,
    comment: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.stateId = `ecos-ts-e-history-modal-${props.record}`;
  }

  onClose = () => {
    this.props.onClose && this.props.onClose();
  };

  render() {
    const { onClose, isOpen, record } = this.props;
    const isMobile = isMobileDevice();

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className={classNames('ecos-ts-e-history-modal', {
          'ecos-modal_width-lg': !isMobile,
          'ecos-modal_width-xs': isMobile
        })}
        isBigHeader
        title={t(CommonLabels.EVENT_HISTORY_TITLE)}
        isOpen={isOpen}
        hideModal={onClose}
      >
        {/*{comment &&*/}
        {/*<div className="ecos-timesheet__white-block">*/}
        {/*  {comment}*/}
        {/*</div>}*/}
        <EventsHistory record={record} stateId={this.stateId} myColumns={CommonTimesheetService.getColumnsEventHistory()} height={500} />
      </EcosModal>
    );
  }
}

export default EventHistoryModal;

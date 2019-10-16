import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EcosModal from '../common/EcosModal';
import { isMobileDevice, t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/constants';

import './style.scss';
import { EventsHistory } from '../EventsHistory';
import CommonTimesheetService from '../../services/timesheet/common';

class EventHistoryModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    record: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.stateId = `ecos-ts-event-story-${props.record}`;
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
        className={classNames('ecos-ts-event-story', {
          'ecos-modal_width-lg': !isMobile,
          'ecos-modal_width-xs': isMobile
        })}
        isBigHeader={true}
        title={t(CommonLabels.EVENT_HISTORY_TITLE)}
        isOpen={isOpen}
        hideModal={onClose}
      >
        <EventsHistory record={record} stateId={this.stateId} myColumns={CommonTimesheetService.getColumnsEventHistory()} minHeight={500} />
      </EcosModal>
    );
  }
}

export default EventHistoryModal;

import React from 'react';
import PropTypes from 'prop-types';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/constants';

import './style.scss';

class EventHistoryModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
  };

  onClose = () => {
    this.props.onClose && this.props.onClose();
  };

  renderTable() {
    const { list = [] } = this.props;

    return list.map((item, i) => (
      <div className="ecos-ts-event-story__container" key={`event-story-${i}-${item.id}`}>
        <div className="ecos-ts-event-story__item ecos-timesheet-event-story__item-date">{item.datetime}</div>
        <div className="ecos-ts-event-story__item ecos-timesheet-event-story__item-author">{item.author}</div>
        <div className="ecos-ts-event-story__item ecos-timesheet-event-story__item-task">{item.task}</div>
        <div className="ecos-ts-event-story__item ecos-timesheet-event-story__item-comment">{item.comment}</div>
      </div>
    ));
  }

  render() {
    const { onClose, isOpen } = this.props;

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-ts-event-story ecos-modal_width-xs"
        isBigHeader={true}
        title={t(CommonLabels.EVENT_HISTORY_TITLE)}
        isOpen={isOpen}
        hideModal={onClose}
      >
        {this.renderTable()}
      </EcosModal>
    );
  }
}

export default EventHistoryModal;

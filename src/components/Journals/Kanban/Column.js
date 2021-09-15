import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { Droppable } from 'react-beautiful-dnd';

import { t } from '../../../helpers/export/util';
import { runAction } from '../../../actions/kanban';
import { selectColumnProps } from '../../../selectors/kanban';
import { InfoText, Loader } from '../../common';
import { Labels } from '../constants';
import { isDropDisabled } from './utils';
import Card from './Card';

class Column extends React.PureComponent {
  handleAction = (...data) => {
    this.props.runAction(...data);
  };

  isColumnDropDisabled() {
    const { readOnly, isLoadingCol, columnInfo } = this.props;
    return isDropDisabled({ readOnly, isLoadingCol, columnInfo });
  }

  getColumnDragTip = flags => {
    const sameDest = flags.draggingFromThisWith === flags.draggingOverWith;

    switch (true) {
      case sameDest:
        return t(Labels.Kanban.DND_ALREADY_HERE);
      case !sameDest:
        return t(Labels.Kanban.DND_MOVE_HERE);
    }
  };

  renderInfo = () => {
    const { records, isFirstLoading, isFiltered, isLoading, isLoadingCol, error } = this.props;
    let text;
    const loading = isFirstLoading || (isLoading && isFiltered) || isLoadingCol;
    const dropDisabled = this.isColumnDropDisabled();

    if (error) {
      text = t(Labels.Kanban.ERROR_FETCH_DATA);
    } else if (loading) {
      text = ' ';
    } else if (dropDisabled) {
      text = t(Labels.Kanban.DND_NOT_MOVE_HERE);
    } else if (isEmpty(records)) {
      text = t(Labels.Kanban.COL_NO_CARD);
    }

    if (!text) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-kanban__card-info', {
          'ecos-kanban__card-info_loading': loading,
          'ecos-kanban__card-info_dnd': dropDisabled
        })}
      >
        <InfoText text={text} noIndents type={'primary'} />
      </div>
    );
  };

  renderContentCard = (record, index) => {
    if (!record) {
      return null;
    }

    const { formProps, readOnly, actions = {} } = this.props;

    return (
      <Card
        key={record.cardId}
        cardIndex={index}
        data={record}
        formProps={formProps}
        readOnly={readOnly}
        actions={actions[record.cardId]}
        onClickAction={this.handleAction}
      />
    );
  };

  render() {
    const { records = [], data, isLoadingCol } = this.props;
    const dropDisabled = this.isColumnDropDisabled();

    return (
      <Droppable droppableId={data.id} isDropDisabled={dropDisabled}>
        {(provided, { draggingFromThisWith, draggingOverWith, isDraggingOver }) => (
          <div
            data-tip={this.getColumnDragTip({ draggingFromThisWith, draggingOverWith, dropDisabled })}
            className={classNames('ecos-kanban__column', {
              'ecos-kanban__column_dragging-over': isDraggingOver,
              'ecos-kanban__column_loading': isLoadingCol,
              'ecos-kanban__column_disabled': dropDisabled,
              'ecos-kanban__column_owner': isDraggingOver && draggingFromThisWith === draggingOverWith,
              'ecos-kanban__column_empty': isEmpty(records)
            })}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {isLoadingCol && <Loader className="ecos-kanban__column-loader" blur />}
            {this.renderInfo()}
            {records.map(this.renderContentCard)}
          </div>
        )}
      </Droppable>
    );
  }
}

function mapStateToProps(state, props) {
  return selectColumnProps(state, props.stateId, props.columnIndex);
}

function mapDispatchToProps(dispatch, props) {
  return {
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId }))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Column);

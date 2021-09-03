import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { extractLabel } from '../../../helpers/util';
import { Icon } from '../../common';
import { DropdownOuter } from '../../common/form';
import { Labels } from '../constants';
import { FormWrapper } from '../../common/dialogs';

class Card extends React.PureComponent {
  handleAction = action => {
    const { data } = this.props;
    this.props.onClickAction(data.cardId, action);
  };

  changeTransform = (provided, snapshot) => {
    const transform = provided.draggableProps.style.transform;

    if (transform && !snapshot.isDragging) {
      provided.draggableProps.style.transform = transform.split(',')[0] + ', 0)';
    }
  };

  renderHeaderCard = provided => {
    const { readOnly, actions, data } = this.props;

    return (
      <div className="ecos-kanban__card-head">
        <div className="ecos-kanban__card-label">
          <div className="ecos-kanban__card-label_main">{extractLabel(data.cardTitle || Labels.KB_CARD_NO_TITLE)}</div>
          <div className="ecos-kanban__card-label_secondary">№ 000003</div>
          {/*todo number*/}
        </div>
        <div className="ecos-kanban__card-action-list">
          {!isEmpty(actions) && (
            <DropdownOuter
              key={data.cardId}
              source={actions}
              valueField={'id'}
              titleField={'name'}
              onChange={this.handleAction}
              isStatic
              boundariesElement="window"
              placement="bottom-end"
              modifiers={null}
              withScrollbar
              scrollbarHeightMax={200}
              className="ecos-kanban__card-action-dropdown"
            >
              <Icon className="ecos-kanban__card-action-icon icon-custom-more-small-normal" />
            </DropdownOuter>
          )}
          {!readOnly && (
            <Icon
              className="ecos-kanban__card-action-icon icon-custom-drag-big ecos-kanban__card-action-drag"
              {...provided.dragHandleProps}
            />
          )}
        </div>
      </div>
    );
  };

  render() {
    const { data, cardIndex, formProps, readOnly } = this.props;

    return (
      <Draggable draggableId={data.cardId} index={cardIndex} isDragDisabled={readOnly}>
        {(provided, snapshot) => {
          this.changeTransform(provided, snapshot);
          return (
            <div ref={provided.innerRef} {...provided.draggableProps}>
              <div className={classNames('ecos-kanban__card', { 'ecos-kanban__card_dragging': snapshot.isDragging })}>
                {this.renderHeaderCard(provided)}
                <div className="ecos-kanban__card-body">
                  <FormWrapper
                    className="ecos-kanban__card-form"
                    isVisible
                    {...formProps}
                    formData={data}
                    formOptions={{
                      readOnly: true,
                      viewAsHtml: true,
                      fullWidthColumns: true,
                      viewAsHtmlConfig: {
                        hidePanels: true
                      }
                    }}
                  />
                </div>
                <div className="ecos-kanban__card-bottom">
                  <Icon className={classNames('ecos-kanban__card-opener', { 'icon-small-down': 1, 'icon-small-up': 0 })} />
                </div>
              </div>
            </div>
          );
        }}
      </Draggable>
    );
  }
}

export default Card;

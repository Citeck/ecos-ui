import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { extractLabel } from '../../../helpers/util';
import { Icon, Tooltip } from '../../common';
import { DropdownOuter } from '../../common/form';
import { Labels } from '../constants';
import { FormWrapper } from '../../common/dialogs';

class Card extends React.PureComponent {
  state = {
    openerSet: new Set()
  };

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

  renderHeader = provided => {
    const { readOnly, actions, data } = this.props;
    const target = `card-title_${data.id}`.replace(/[:@/]/gim, '');

    return (
      <div className="ecos-kanban__card-head">
        <div className="ecos-kanban__card-label">
          <Tooltip target={target} text={data.cardTitle} uncontrolled off={!data.cardTitle}>
            <div
              id={target}
              className={classNames('ecos-kanban__card-label_main', { 'ecos-kanban__card-label_main-with-sub': data.cardSubtitle })}
            >
              {extractLabel(data.cardTitle || Labels.Kanban.CARD_NO_TITLE)}
            </div>
          </Tooltip>
          {data.cardSubtitle && <div className="ecos-kanban__card-label_secondary">{data.cardSubtitle}</div>}
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

  renderBottom = () => {
    const { data } = this.props;
    const { openerSet } = this.state;

    return (
      <div className="ecos-kanban__card-bottom">
        <Icon
          className={classNames('ecos-kanban__card-opener', {
            'icon-small-down': openerSet.has(data.cardId),
            'icon-small-up': !openerSet.has(data.cardId)
          })}
          onClick={() => this.handleOpenCard(data.cardId)}
        />
      </div>
    );
  };

  handleOpenCard = cardId => {
    const { openerSet } = this.state;
    const newSet = new Set([...openerSet]);

    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }

    this.setState({ openerSet: newSet });
  };

  render() {
    const { data, cardIndex, formProps, readOnly } = this.props;
    const { openerSet } = this.state;

    return (
      <Draggable draggableId={data.cardId} index={cardIndex} isDragDisabled={readOnly}>
        {(provided, snapshot) => {
          this.changeTransform(provided, snapshot);
          return (
            <div ref={provided.innerRef} {...provided.draggableProps}>
              <div className={classNames('ecos-kanban__card', { 'ecos-kanban__card_dragging': snapshot.isDragging })}>
                {this.renderHeader(provided)}
                <div className={classNames('ecos-kanban__card-body', { 'ecos-kanban__card-body_hidden': openerSet.has(data.cardId) })}>
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
              </div>
            </div>
          );
        }}
      </Draggable>
    );
  }
}

export default Card;

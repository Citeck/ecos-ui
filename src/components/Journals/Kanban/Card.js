import React from 'react';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import { Draggable } from 'react-beautiful-dnd';
import ReactResizeDetector from 'react-resize-detector';

import { extractLabel } from '../../../helpers/util';
import ViewAction from '../../Records/actions/handler/executor/ViewAction';
import { Icon, Tooltip } from '../../common';
import { DropdownOuter } from '../../common/form';
import { Labels } from '../constants';
import { FormWrapper } from '../../common/dialogs';

class Card extends React.PureComponent {
  state = {
    openerSet: new Set(),
    noForm: true
  };

  handleAction = action => {
    const { data } = this.props;
    this.props.onClickAction(data.cardId, action);
  };

  handleHeaderClick = () => {
    const { data } = this.props;
    this.props.onClickAction(data.cardId, { type: ViewAction.ACTION_ID });
  };

  handleDetectHeight = (w, h) => {
    this.setState({ noForm: !h });
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
          <Tooltip target={target} text={data.cardTitle} uncontrolled off={!data.cardTitle || !data.cardSubtitle}>
            <div
              id={target}
              className={classNames('ecos-kanban__card-label_main', { 'ecos-kanban__card-label_main-with-sub': data.cardSubtitle })}
              onClick={this.handleHeaderClick}
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

  renderBody = () => {
    const { data, formProps } = this.props;
    const { openerSet } = this.state;

    return (
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
        <ReactResizeDetector handleHeight onResize={debounce(this.handleDetectHeight, 400)} />
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
    const { data, cardIndex, readOnly } = this.props;
    const { noForm } = this.state;

    return (
      <Draggable draggableId={data.cardId} index={cardIndex} isDragDisabled={readOnly}>
        {(provided, snapshot) => {
          this.changeTransform(provided, snapshot);
          return (
            <div ref={provided.innerRef} {...provided.draggableProps}>
              <div
                className={classNames('ecos-kanban__card', {
                  'ecos-kanban__card_dragging': snapshot.isDragging,
                  'ecos-kanban__card_no-form': noForm
                })}
              >
                {this.renderHeader(provided)}
                {this.renderBody()}
              </div>
            </div>
          );
        }}
      </Draggable>
    );
  }
}

export default Card;

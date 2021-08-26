import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { extractLabel } from '../../../helpers/util';
import { Icon, Panel, Separator } from '../../common';
import { Caption, DropdownOuter } from '../../common/form';
import { IcoBtn } from '../../common/btns';
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
      <>
        <Caption small className="ecos-kanban__column-card-caption">
          {extractLabel(data.cardTitle || Labels.KB_CARD_NO_TITLE)}
          <div className="ecos-kanban__column-card-action-list">
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
                className="ecos-kanban__column-card-action-dropdown"
              >
                <IcoBtn icon="icon-custom-more-small-normal" className="ecos-btn_i ecos-btn_grey2 ecos-btn_hover_t-light-blue" />
              </DropdownOuter>
            )}
            {!readOnly && <Icon className="icon-custom-drag-big ecos-kanban__column-card-action-drag" {...provided.dragHandleProps} />}
          </div>
        </Caption>
        <Separator noIndents />
      </>
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
              <Panel
                className={classNames('ecos-kanban__column-card', { 'ecos-kanban__column-card_dragging': snapshot.isDragging })}
                bodyClassName="ecos-kanban__column-card-body"
                header={this.renderHeaderCard(provided)}
              >
                <FormWrapper
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
              </Panel>
            </div>
          );
        }}
      </Draggable>
    );
  }
}

export default Card;

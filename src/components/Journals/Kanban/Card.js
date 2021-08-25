import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { extractLabel } from '../../../helpers/util';
import { Panel, Separator } from '../../common';
import { FormWrapper } from '../../common/dialogs';
import { Caption, DropdownOuter } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { Labels } from '../constants';

class Card extends React.PureComponent {
  handleAction = action => {
    const { data } = this.props;
    this.props.onClickAction(data.cardId, action);
  };

  renderHeaderCard = () => {
    const { readOnly, actions, data } = this.props;
    const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';

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
                controlIcon="icon-custom-more-big-pressed"
                className="ecos-kanban__column-card-action-dropdown"
                controlClassName="ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue"
              >
                <IcoBtn
                  icon="icon-custom-more-big-pressed"
                  className="ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
                />
              </DropdownOuter>
            )}
            {!readOnly && (
              <IcoBtn icon="icon-custom-drag-big" className={'ecos-kanban__column-card-action-drag ' + grey} onClick={_ => _} />
            )}
          </div>
        </Caption>
        <Separator noIndents />
      </>
    );
  };

  render() {
    const { data, formProps } = this.props;

    return (
      <Panel className="ecos-kanban__column-card" bodyClassName="ecos-kanban__column-card-body" header={this.renderHeaderCard()}>
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
    );
  }
}

export default Card;

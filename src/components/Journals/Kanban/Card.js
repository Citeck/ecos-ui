import React, { Component } from 'react';

import { extractLabel } from '../../../helpers/util';
import { Panel, Separator } from '../../common';
import { FormWrapper } from '../../common/dialogs';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { Labels } from '../constants';

class Card extends Component {
  renderHeaderCard = data => {
    const { readOnly, actions } = this.props;
    const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';

    return (
      <>
        <Caption small className="ecos-kanban__column-card-caption">
          {extractLabel(data.cardTitle || Labels.KB_CARD_NO_TITLE)}
          <div className="ecos-kanban__column-card-action-list">
            {!!actions && <IcoBtn icon="icon-custom-more-big-pressed" className={grey} onClick={_ => _} />}
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
    const { data, formProps, readOnly } = this.props;

    return (
      <Panel className="ecos-kanban__column-card" bodyClassName="ecos-kanban__column-card-body" header={this.renderHeaderCard(data)}>
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

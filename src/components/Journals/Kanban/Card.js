import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { extractLabel } from '../../../helpers/util';
import { DropdownActions, Panel, Separator } from '../../common';
import { FormWrapper } from '../../common/dialogs';
import { Caption } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import { Labels } from '../constants';
import RecordActions from '../../Records/actions/recordActions'; //todo

class Card extends React.PureComponent {
  handleAction = action => {
    const { data } = this.props;
    RecordActions.execForRecord(data.cardId, action);
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
              <DropdownActions
                htmlId={data.cardId.replace(/[:@/]/gim, '')}
                list={actions.map(act => ({ ...act, text: act.name }))}
                onClick={this.handleAction}
              />
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
    const { data, formProps, readOnly } = this.props;

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

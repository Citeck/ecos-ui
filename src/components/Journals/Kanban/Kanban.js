import React from 'react';
import { connect } from 'react-redux';

import { extractLabel } from '../../../helpers/util';
import { selectKanbanProps } from '../../../selectors/kanban';
import { Loader, Panel, Separator } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { EcosForm, FORM_MODE_EDIT } from '../../EcosForm';

import './style.scss';

function mapStateToProps(state, props) {
  return selectKanbanProps(state, props.stateId);
}

function mapDispatchToProps(dispatch) {
  return {};
}

class Kanban extends React.Component {
  renderHeaderCard = data => {
    const { readOnly, actions } = this.props;
    const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';

    return (
      <>
        <Caption small className="ecos-kanban__column-card-caption">
          {extractLabel(data.name || 'TEST')}
          <div className="ecos-kanban__column-card-action-list">
            {!!actions && <IcoBtn icon="icon-custom-more-big-pressed" className={grey} onClick={_ => _} />}

            {!readOnly && <IcoBtn icon="icon-custom-drag-big" className={grey} onClick={_ => _} />}
          </div>
        </Caption>
        <Separator noIndents />
      </>
    );
  };

  renderColumnHead = data => {
    return (
      <div className="ecos-kanban__column" key={data.id}>
        <Panel
          className="ecos-kanban__column-head"
          header={
            <TitlePageLoader isReady={!!data.name} withBadge>
              <Caption small className="ecos-kanban__column-head-caption">
                {extractLabel(data.name).toUpperCase()}
              </Caption>
              <Badge text={10} />
            </TitlePageLoader>
          }
          noChild
        />
      </div>
    );
  };

  renderColumnContent = data => {
    const { cards = [] } = this.props;

    return (
      <div className="ecos-kanban__column" key={data.id}>
        <div className="ecos-kanban__column-card-list">{cards.map(this.renderCard)}</div>
      </div>
    );
  };

  renderNoCard = () => {};

  renderCard = data => {
    const { cardFormRef } = this.props;

    return (
      <Panel
        key={data.id}
        className="ecos-kanban__column-card"
        bodyClassName="ecos-kanban__column-card-body"
        header={this.renderHeaderCard(data)}
      >
        <EcosForm
          className="ecos-kanban__column-card-form"
          record={'uiserv/form@ECOSUI1242CARD'}
          formId={cardFormRef}
          options={{
            readOnly: true,
            viewAsHtml: true,
            fullWidthColumns: true,
            viewAsHtmlConfig: {
              hidePanels: true
            },
            formMode: FORM_MODE_EDIT,
            onInlineEditSave: _ => _
          }}
          onFormSubmitDone={_ => _}
          onReady={_ => _}
          onToggleLoader={_ => _}
          initiator={{
            type: 'widget',
            name: 'kanban'
          }}
        />
      </Panel>
    );
  };

  render() {
    const { columns = Array(3).fill({}), maxHeight, isLoading } = this.props;

    return (
      <div className="ecos-kanban">
        <div className="ecos-kanban__head">{columns.map(this.renderColumnHead)}</div>
        <div className="ecos-kanban__body" style={{ maxHeight: `calc(${maxHeight}px - 100px)` }}>
          {isLoading && <Loader blur />}
          {columns.map(this.renderColumnContent)}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Kanban);

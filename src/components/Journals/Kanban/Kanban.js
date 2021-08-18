import React from 'react';
import { connect } from 'react-redux';

import { extractLabel } from '../../../helpers/util';
import { selectKanbanProps } from '../../../selectors/kanban';
import { Panel, Separator } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { FORM_MODE_EDIT, EcosForm } from '../../EcosForm';

import './style.scss';

function mapStateToProps(state, props) {
  return selectKanbanProps(state, props.stateId);
}

function mapDispatchToProps(dispatch) {
  return {};
}

class Kanban extends React.Component {
  //todooo grid?
  renderHeaderCol = data => {
    return (
      <TitlePageLoader isReady={!!data.name} withBadge>
        <Caption small className="ecos-kanban__column-name-caption">
          {extractLabel(data.name).toUpperCase()}
        </Caption>
        <Badge text={10} />
      </TitlePageLoader>
    );
  };

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

  renderColumn = data => {
    const { cards = Array(13).fill({}) } = this.props;

    return (
      <div className="ecos-kanban__column" key={data.id}>
        <Panel className="ecos-kanban__column-name" header={this.renderHeaderCol(data)} noChild />
        <div className="ecos-kanban__column-card-list">{cards.map(this.renderCard)}</div>
      </div>
    );
  };

  renderCard = data => {
    const { cardFormRef } = this.props;

    return (
      <Panel key={data.id} className="ecos-kanban__column-card" header={this.renderHeaderCard(data)}>
        <EcosForm
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
    const { columns = Array(3).fill({}), maxHeight } = this.props;

    return (
      <div className="ecos-kanban" style={{ maxHeight }}>
        {columns.map(this.renderColumn)}
      </div>
    );
  }
}

export default connect(mapStateToProps)(Kanban);

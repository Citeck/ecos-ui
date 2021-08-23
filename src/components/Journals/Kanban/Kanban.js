import React from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';
import { getNextPage } from '../../../actions/kanban';
import { selectKanbanProps } from '../../../selectors/kanban';
import { InfoText, Panel, PointsLoader, Separator } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { FormWrapper } from '../../common/dialogs';
import { Labels } from '../constants';

import './style.scss';

function mapStateToProps(state, props) {
  return selectKanbanProps(state, props.stateId);
}

function mapDispatchToProps(dispatch, props) {
  return {
    getNextPage: () => dispatch(getNextPage({ stateId: props.stateId }))
  };
}

class Kanban extends React.Component {
  handleScrollFrame = (scroll = {}) => {
    if (scroll.scrollTop + scroll.clientHeight === scroll.scrollHeight) {
      this.props.getNextPage();
    }
  };

  renderHeaderColumn = (data, index) => {
    const { dataCards = [] } = this.props;
    const totalCount = get(dataCards, [index, 'totalCount']);

    return (
      <div className="ecos-kanban__column" key={`head_${data.id}`}>
        <div className="ecos-kanban__column-head">
          <TitlePageLoader isReady={!!data.name} withBadge>
            <Caption small className="ecos-kanban__column-head-caption">
              {extractLabel(data.name).toUpperCase() || t(Labels.KB_CARD_NO_TITLE)}
            </Caption>
            {totalCount && <Badge text={totalCount} />}
          </TitlePageLoader>
        </div>
      </div>
    );
  };

  renderContentColumn = (data, index) => {
    const { dataCards, isLoading } = this.props;
    const cards = get(dataCards, [index, 'records']);

    return (
      <div className="ecos-kanban__column" key={`col_${data.id}`}>
        <div className="ecos-kanban__column-card-list">
          {isEmpty(cards) ? this.renderNoCard(isLoading) : cards.map(this.renderContentCard)}
        </div>
      </div>
    );
  };

  renderContentCard = (data, index) => {
    const { formProps } = this.props;

    return (
      <Panel
        key={`card_${data.id}`}
        className="ecos-kanban__column-card"
        bodyClassName="ecos-kanban__column-card-body"
        header={this.renderHeaderCard(data)}
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
    );
  };

  renderHeaderCard = data => {
    const { readOnly, actions } = this.props;
    const grey = 'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue';

    return (
      <>
        <Caption small className="ecos-kanban__column-card-caption">
          {extractLabel(data.name || Labels.KB_CARD_NO_TITLE)}
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

  renderNoCard = noText => {
    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={noText ? '' : t(Labels.KB_COL_NO_CARD)} />
      </div>
    );
  };

  render() {
    const { columns = [], maxHeight } = this.props;
    const cols = columns || Array(3).map((_, id) => ({ id }));

    return (
      <div className="ecos-kanban">
        <div className="ecos-kanban__head">{cols.map(this.renderHeaderColumn)}</div>
        <Scrollbars
          autoHeight
          autoHeightMin={maxHeight - 100}
          autoHeightMax={maxHeight - 100}
          renderThumbVertical={props => <div {...props} className="ecos-kanban__scroll_v" />}
          renderTrackHorizontal={() => <div hidden />}
          onScrollFrame={this.handleScrollFrame}
        >
          <div className="ecos-kanban__body">{columns.map(this.renderContentColumn)}</div>
          <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kanban);

import React from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';
import { selectKanbanProps } from '../../../selectors/kanban';
import { InfoText, Panel, PointsLoader, Separator } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { FormWrapper } from '../../common/dialogs';

import './style.scss';
import { Labels } from '../constants';

function mapStateToProps(state, props) {
  return selectKanbanProps(state, props.stateId);
}

function mapDispatchToProps(dispatch) {
  return {};
}

class Kanban extends React.Component {
  HeaderColumn = React.memo(({ data }) => {
    return (
      <div className="ecos-kanban__column">
        <div className="ecos-kanban__column-head">
          <TitlePageLoader isReady={!!data.name} withBadge>
            <Caption small className="ecos-kanban__column-head-caption">
              {extractLabel(data.name).toUpperCase() || t(Labels.KB_CARD_NO_TITLE)}
            </Caption>
            {data.totalCount && <Badge text={data.totalCount} />}
          </TitlePageLoader>
        </div>
      </div>
    );
  }, isEqual);

  HeaderCard = ({ data }) => {
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

  ContentColumn = React.memo(({ cards = {} }) => {
    return (
      <div className="ecos-kanban__column">
        <div className="ecos-kanban__column-card-list">
          {isEmpty(cards) ? <this.NoCard /> : cards.map(data => <this.ContentCard key={data.id} data={data} />)}
        </div>
      </div>
    );
  }, isEqual);

  NoCard = () => {
    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={t(Labels.KB_COL_NO_CARD)} />
      </div>
    );
  };

  ContentCard = ({ data }) => {
    const { formProps } = this.props;

    return (
      <Panel className="ecos-kanban__column-card" bodyClassName="ecos-kanban__column-card-body" header={<this.HeaderCard data={data} />}>
        <FormWrapper
          isVisible
          {...formProps}
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

  render() {
    const { dataCards = [], columns = Array(3).map((_, id) => ({ id })), maxHeight, isLoading } = this.props;

    return (
      <div className="ecos-kanban">
        <div className="ecos-kanban__head">
          {columns.map(data => (
            <this.HeaderColumn key={'head' + data.id} data={{ ...data, totalCount: get(dataCards, [0, 'totalCount']) }} />
          ))}
        </div>
        <Scrollbars
          autoHeight
          autoHeightMin={maxHeight - 100}
          autoHeightMax={maxHeight - 100}
          renderThumbVertical={props => <div {...props} hidden />}
          renderTrackHorizontal={() => <div hidden />}
        >
          <div className="ecos-kanban__body">
            {columns.map((data, index) => (
              <this.ContentColumn key={data.id} cards={get(dataCards, [0, 'records'])} />
            ))}
          </div>
          <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />
        </Scrollbars>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Kanban);

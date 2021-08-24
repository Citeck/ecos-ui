import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';
import { getNextPage } from '../../../actions/kanban';
import { selectKanbanProps } from '../../../selectors/kanban';
import { PointsLoader } from '../../common';
import { Badge, Caption } from '../../common/form';
import TitlePageLoader from '../../common/TitlePageLoader';
import { Labels } from '../constants';
import Column from './Column';

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
    const { dataCards = [], isFirstLoading } = this.props;
    const totalCount = get(dataCards, [index, 'totalCount']);

    return (
      <div className="ecos-kanban__column" key={`head_${data.id}`}>
        <div className="ecos-kanban__column-head">
          <TitlePageLoader isReady={!isFirstLoading} withBadge>
            <Caption small className="ecos-kanban__column-head-caption">
              {extractLabel(data.name).toUpperCase() || t(Labels.KB_CARD_NO_TITLE)}
            </Caption>
            {!!totalCount && <Badge text={totalCount} />}
          </TitlePageLoader>
        </div>
      </div>
    );
  };

  renderColumn = (data, index) => {
    const { dataCards, isFirstLoading, formProps, readOnly } = this.props;
    const records = get(dataCards, [index, 'records']);
    const error = get(dataCards, [index, 'error']);

    return (
      <Column
        key={`col_${data.id}`}
        records={records}
        error={error}
        isFirstLoading={isFirstLoading}
        formProps={formProps}
        readOnly={readOnly}
      />
    );
  };

  render() {
    const { columns = [], maxHeight, isLoading, isFirstLoading } = this.props;
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
          <div className="ecos-kanban__body">{columns.map(this.renderColumn)}</div>
          {(isLoading || isFirstLoading) && <PointsLoader className="ecos-kanban__loader" color={'light-blue'} />}
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kanban);

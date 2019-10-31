import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import Dashlet from '../Dashlet/Dashlet';
import { selectStateByKey } from '../../selectors/birthdays';
import { init } from '../../actions/birthdays';
import { t } from '../../helpers/util';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { DefineHeight } from '../common';

const LABELS = {
  TITLE: 'Дни рождения'
};

class Birthdays extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    props.init();
  }

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  setContentHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  handleResize = width => {
    this.setState({ width });
  };

  handleChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  render() {
    const { canDragging, dragHandleProps } = this.props;
    const { isCollapsed, userHeight = 0, fitHeights, contentHeight } = this.state;
    const fixHeight = userHeight ? userHeight : null;

    return (
      <div className="ecos-hb2u">
        <Dashlet
          title={t(LABELS.TITLE)}
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          actionReload={false}
          canDragging={canDragging}
          resizable
          isCollapsed={isCollapsed}
          onResize={this.handleResize}
          onChangeHeight={this.handleChangeHeight}
          onToggleCollapse={this.handleToggleContent}
          dragHandleProps={dragHandleProps}
          getFitHeights={this.setFitHeights}
        >
          <Scrollbars autoHide style={{ height: contentHeight || '100%' }}>
            <DefineHeight fixHeight={fixHeight} maxHeight={fitHeights.max} minHeight={1} getOptimalHeight={this.setContentHeight}>
              Birthday
            </DefineHeight>
          </Scrollbars>
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateByKey(state, ownProps.stateId) });

const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init(ownProps.id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Birthdays);

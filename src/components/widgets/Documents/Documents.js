import React from 'react';
import { connect } from 'react-redux';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';

const LABELS = {
  TITLE: 'Документы'
};

class Documents extends BaseWidget {
  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  handleReloadData = () => {};

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed } = this.state;

    return (
      <div>
        <Dashlet
          title={t(LABELS.TITLE)}
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          canDragging={canDragging}
          resizable
          contentMaxHeight={this.clientHeight}
          onReload={this.handleReloadData}
          onResize={this.handleResize}
          dragHandleProps={dragHandleProps}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={isCollapsed}
        >
          Документы
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  isMobile: state.view.isMobile
});
const mapDispatchToProps = (dispatch, ownProps) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Documents);

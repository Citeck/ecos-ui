import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import Dashlet from '../Dashlet/Dashlet';
import { selectStateByKey } from '../../selectors/birthdays';
import { getBirthdays, init } from '../../actions/birthdays';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { DefineHeight, Avatar } from '../common';
import { t } from '../../helpers/util';

import './style.scss';

const LABELS = {
  TITLE: 'Дни рождения'
};

class Birthdays extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    birthdays: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        date: PropTypes.string,
        name: PropTypes.string,
        avatar: PropTypes.string,
        nodeRef: PropTypes.string
      })
    ).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    init: PropTypes.func.isRequired,
    getBirthdays: PropTypes.func.isRequired
  };

  static defaultProps = {};

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

  componentDidMount() {
    this.props.getBirthdays();
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

  renderList() {
    const { id, birthdays } = this.props;

    if (!birthdays.length) {
      return null;
    }

    return (
      <div className="ecos-hb2u__list">
        {birthdays.map(item => (
          <div className="ecos-hb2u__list-item" key={item.id}>
            <Avatar
              url={item.avatar}
              userName={item.name}
              className="ecos-hb2u__list-item-photo"
              classNameEmpty="ecos-hb2u__list-item-photo_empty"
            />

            <div className="ecos-hb2u__list-item-info">
              <div className="ecos-hb2u__list-item-date">{item.date}</div>
              <div className="ecos-hb2u__list-item-name">{item.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { canDragging, dragHandleProps } = this.props;
    const { isCollapsed, userHeight = 0, fitHeights, contentHeight } = this.state;
    const fixHeight = userHeight ? userHeight : null;

    return (
      <Dashlet
        className="ecos-hb2u"
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
            {this.renderList()}
          </DefineHeight>
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateByKey(state, ownProps.id) });

const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init(ownProps.id)),
  getBirthdays: () => dispatch(getBirthdays(ownProps.id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Birthdays);

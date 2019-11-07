import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import get from 'lodash/get';

import Dashlet from '../Dashlet/Dashlet';
import { selectStateByKey } from '../../selectors/birthdays';
import { getBirthdays, init } from '../../actions/birthdays';
import { MIN_WIDTH_DASHLET_SMALL, MIN_WIDTH_DASHLET_LARGE } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { DefineHeight, Avatar, Loader } from '../common';
import { Btn } from '../common/btns';
import { getAdaptiveNumberStr, t } from '../../helpers/util';
import { changeUrlLink } from '../PageTabs/PageTabs';

import './style.scss';

export const LABELS = {
  TITLE: 'birthdays-widget.title',
  ERROR_DEFAULT_MESSAGE: 'birthdays-widget.error.default-message',
  BTN_TO_PROFILE: 'birthdays-widget.btn.go-to-profile',
  BTN_TRY_ONE_MORE_TIME: 'birthdays-widget.btn.try-one-more-time'
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
        nodeRef: PropTypes.string,
        url: PropTypes.string
      })
    ).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    init: PropTypes.func.isRequired,
    getBirthdays: PropTypes.func.isRequired
  };

  static defaultProps = {
    isLoading: false,
    error: ''
  };

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

  get isLargeSize() {
    return this.state.width >= MIN_WIDTH_DASHLET_LARGE;
  }

  get noBody() {
    const { totalCount, isLoading, error } = this.props;

    return !totalCount && !isLoading && !error;
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

  handleGoToProfile = url => {
    changeUrlLink(url, { openNewBrowserTab: true });
  };

  handleReloadData = () => {
    this.props.getBirthdays();
  };

  renderList() {
    const { birthdays, error } = this.props;

    if (!birthdays.length || error) {
      return null;
    }

    return (
      <div className="ecos-hb2u__list">
        {birthdays.map(item => (
          <div
            className={classNames('ecos-hb2u__list-item', {
              'ecos-hb2u__list-item_small': !this.isLargeSize
            })}
            title={this.isLargeSize ? '' : t(LABELS.BTN_TO_PROFILE)}
            key={item.id}
            onClick={this.isLargeSize ? null : () => this.handleGoToProfile(item.url)}
          >
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

            {this.isLargeSize && (
              <Btn className="ecos-hb2u__list-item-btn" onClick={() => this.handleGoToProfile(item.url)}>
                {t(LABELS.BTN_TO_PROFILE)}
              </Btn>
            )}
          </div>
        ))}
      </div>
    );
  }

  renderLoader() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur />;
  }

  renderError() {
    const { error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <div className="ecos-hb2u__error">
        <div className="ecos-hb2u__error-message">{error}</div>
        <Btn className="ecos-hb2u__error-reload-btn" onClick={this.handleReloadData}>
          {t(LABELS.BTN_TRY_ONE_MORE_TIME)}
        </Btn>
      </div>
    );
  }

  render() {
    const { canDragging, dragHandleProps, totalCount } = this.props;
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
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={this.noBody}
      >
        <Scrollbars autoHide style={{ height: contentHeight || '100%' }}>
          <DefineHeight
            className="ecos-hb2u__container"
            fixHeight={fixHeight}
            maxHeight={fitHeights.max}
            minHeight={1}
            getOptimalHeight={this.setContentHeight}
          >
            {this.renderList()}
            {this.renderLoader()}
            {this.renderError()}
          </DefineHeight>
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, ownProps.id),
  isMobile: get(state, 'view.isMobile', false)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init(ownProps.id)),
  getBirthdays: () => dispatch(getBirthdays(ownProps.id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Birthdays);

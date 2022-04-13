import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import get from 'lodash/get';

import { selectStateByKey } from '../../../selectors/birthdays';
import { getBirthdays, resetStore } from '../../../actions/birthdays';
import { MIN_WIDTH_DASHLET_LARGE } from '../../../constants';
import { getAdaptiveNumberStr, t } from '../../../helpers/util';
import { isNewVersionPage } from '../../../helpers/urls';
import { getStateId } from '../../../helpers/redux';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import PageService from '../../../services/PageService';
import { Avatar, Loader } from '../../common';
import { Btn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';

import './style.scss';

export const Labels = {
  TITLE: 'birthdays-widget.title',
  ERROR_DEFAULT_MESSAGE: 'birthdays-widget.error.default-message',
  BTN_TO_PROFILE: 'birthdays-widget.btn.go-to-profile',
  BTN_TRY_ONE_MORE_TIME: 'birthdays-widget.btn.try-one-more-time'
};

class Birthdays extends BaseWidget {
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
    error: PropTypes.string,
    isLoading: PropTypes.bool
  };

  static defaultProps = {
    isLoading: false,
    error: ''
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
  }

  componentDidMount() {
    super.componentDidMount();

    this.props.getBirthdays();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.props.resetStore();
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
    UserLocalSettingsService.setDashletHeight(this.state.lsId, height);
    this.setState({ userHeight: height });
  };

  handleGoToProfile = url => {
    const openNewTab = isNewVersionPage(url);

    PageService.changeUrlLink(url, { openNewBrowserTab: !openNewTab, openNewTab });
  };

  handleReloadData = () => {
    this.props.getBirthdays();
  };

  handleUpdate = () => {
    this.handleReloadData();
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
            title={this.isLargeSize ? '' : t(Labels.BTN_TO_PROFILE)}
            key={item.id}
            onClick={this.isLargeSize ? null : () => this.handleGoToProfile(item.url)}
          >
            <Avatar
              url={item.avatar}
              userName={item.name}
              className="ecos-hb2u__list-item-photo"
              classNameEmpty="ecos-hb2u__list-item-photo_empty"
              noBorder
            />

            <div className="ecos-hb2u__list-item-info">
              <div className="ecos-hb2u__list-item-date">{item.date}</div>
              <div className="ecos-hb2u__list-item-name">{item.name}</div>
            </div>

            {this.isLargeSize && (
              <Btn className="ecos-hb2u__list-item-btn" onClick={() => this.handleGoToProfile(item.url)}>
                {t(Labels.BTN_TO_PROFILE)}
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
          {t(Labels.BTN_TRY_ONE_MORE_TIME)}
        </Btn>
      </div>
    );
  }

  render() {
    const { canDragging, dragHandleProps, totalCount } = this.props;

    return (
      <Dashlet
        className="ecos-hb2u"
        title={t(Labels.TITLE)}
        needGoTo={false}
        noActions
        canDragging={canDragging}
        resizable
        isCollapsed={this.isCollapsed}
        onResize={this.handleResize}
        onChangeHeight={this.handleChangeHeight}
        onToggleCollapse={this.handleToggleContent}
        dragHandleProps={dragHandleProps}
        getFitHeights={this.setFitHeights}
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={this.noBody}
        setRef={this.setDashletRef}
      >
        <Scrollbars autoHide {...this.scrollbarProps}>
          {this.renderList()}
          {this.renderLoader()}
          {this.renderError()}
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, getStateId(ownProps)),
  isMobile: get(state, 'view.isMobile', false)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  resetStore: () => dispatch(resetStore(getStateId(ownProps))),
  getBirthdays: () => dispatch(getBirthdays(getStateId(ownProps)))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Birthdays);

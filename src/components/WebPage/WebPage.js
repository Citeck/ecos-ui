import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { Btn } from '../common/btns';
import Dashlet from '../Dashlet/Dashlet';
import { t } from '../../helpers/util';
import './style.scss';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';

const LABELS = {
  EMPTY_DATA: 'Содержимого нет. Укажите в настройках адрес веб-страницы.',
  SETTINGS_BTN: 'Настроить'
};

class WebPage extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string,
    title: PropTypes.string
  };

  static defaultProps = {
    url: '',
    title: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      fitHeights: {},
      contentHeight: null,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  handleEdit = () => {};

  handleReload = () => {};

  handleResize = width => {
    this.setState({ width });
  };

  handleChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  renderEmptyData() {
    const { url } = this.props;

    if (url.length) {
      return null;
    }

    return (
      <div className="ecos-wpage__ground">
        <div className="ecos-wpage__text">{t(LABELS.EMPTY_DATA)}</div>

        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue">
          <span className="ecos-vj__btn-add-title">{t(LABELS.SETTINGS_BTN)}</span>
        </Btn>
      </div>
    );
  }

  render() {
    return (
      <Dashlet
        title={t('web-page-widget.title')}
        className="ecos-wpage"
        bodyClassName="ecos-wpage__body"
        needGoTo={false}
        actionEdit
        actionReload
        actionHelp
        resizable
        onResize={this.handleResize}
        onChangeHeight={this.handleChangeHeight}
        onEdit={this.handleEdit}
        onReload={this.handleReload}
      >
        {this.renderEmptyData()}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

const mapDispatchToProps = (dispatch, ownProps) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebPage);

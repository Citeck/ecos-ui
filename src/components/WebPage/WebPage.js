import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { Btn } from '../common/btns';
import { Label, Input } from '../common/form';
import Dashlet from '../Dashlet/Dashlet';
import { t } from '../../helpers/util';
import './style.scss';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';

const LABELS = {
  EMPTY_DATA: 'Содержимого нет. Укажите в настройках адрес веб-страницы.',
  SETTINGS_BTN: 'Настроить',
  SETTINGS_LABEL_TITLE: 'Заголовок виджета',
  SETTINGS_PLACEHOLDER_TITLE: 'Например название веб-ресурса',
  SETTINGS_LABEL_URL: 'URL-адрес ресурса',
  SETTINGS_PLACEHOLDER_URL: 'www.google.com'
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
      settingsIsShow: false,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  handleEdit = () => {
    this.setState({ settingsIsShow: true });
  };

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
    const { settingsIsShow } = this.state;

    if (url || settingsIsShow) {
      return null;
    }

    return (
      <div className="ecos-wpage__ground">
        <div className="ecos-wpage__text">{t(LABELS.EMPTY_DATA)}</div>

        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleEdit}>
          <span className="ecos-vj__btn-add-title">{t(LABELS.SETTINGS_BTN)}</span>
        </Btn>
      </div>
    );
  }

  renderSettings() {
    const { settingsIsShow } = this.state;

    if (!settingsIsShow) {
      return null;
    }

    return (
      <div className="ecos-wpage__settings">
        <Label for="title-input" className="ecos-wpage__settings-label">
          {t(LABELS.SETTINGS_LABEL_TITLE)}
        </Label>
        <Input id="title-input" className="ecos-wpage__settings-input" placeholder={t(LABELS.SETTINGS_PLACEHOLDER_TITLE)} />

        <Label for="url-input" className="ecos-wpage__settings-label">
          {t(LABELS.SETTINGS_LABEL_URL)}
        </Label>
        <Input id="url-input" className="ecos-wpage__settings-input" placeholder={t(LABELS.SETTINGS_PLACEHOLDER_URL)} />
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
        {this.renderSettings()}
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

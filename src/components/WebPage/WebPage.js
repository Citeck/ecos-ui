import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import Iframe from 'react-iframe';

import { Loader } from '../common';
import { Btn } from '../common/btns';
import { Label, Input } from '../common/form';
import Dashlet from '../Dashlet/Dashlet';
import { t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { initPage, setPageData } from '../../actions/webPage';
import { selectStateById } from '../../selectors/webPage';

import './style.scss';

const LABELS = {
  EMPTY_DATA: 'Содержимого нет. Укажите в настройках адрес веб-страницы.',
  SETTINGS_BTN: 'Настроить',
  SETTINGS_LABEL_TITLE: 'Заголовок виджета',
  SETTINGS_PLACEHOLDER_TITLE: 'Например название веб-ресурса',
  SETTINGS_LABEL_URL: 'URL-адрес ресурса',
  SETTINGS_PLACEHOLDER_URL: 'www.google.com',
  SETTINGS_BTN_CANCEL: 'Отмена',
  SETTINGS_BTN_SAVE: 'Готово',
  ERROR: 'Ошибка!',
  UPDATE_BTN: 'Обновить'
};

class WebPage extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    config: PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string
    }),
    url: PropTypes.string,
    title: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    initPage: PropTypes.func.isRequired,
    setPageData: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
  };

  static defaultProps = {
    url: '',
    title: '',
    isLoading: false,
    // todo: возможно, стоит сохранять данные не в config, а просто в props виджета дашборда
    config: {
      url: '',
      title: ''
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      fitHeights: {},
      contentHeight: null,
      settingsIsShow: false,
      title: props.title,
      url: props.url,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    props.setPageData(props.config);
  }

  componentDidMount() {
    this.props.initPage();
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!state.url && props.url) {
      newState.url = props.url;
    }

    if (!state.title && props.title) {
      newState.title = props.title;
    }

    if (Object.keys(newState).length) {
      return newState;
    }

    return null;
  }

  get canSave() {
    const { title, url } = this.state;

    return title && url;
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

  handleChangeTitle = event => {
    this.setState({ title: event.target.value });
  };

  handleChangeUrl = event => {
    this.setState({ url: event.target.value });
  };

  handleCancelEdit = () => {
    this.setState((state, props) => ({
      settingsIsShow: false,
      url: props.url,
      title: props.title
    }));
  };

  handleSaveEdit = () => {
    const { onSave, id, setPageData } = this.props;
    const { url, title } = this.state;

    onSave(id, { config: { url, title } });
    setPageData({ url, title });
    this.setState({ settingsIsShow: false });
  };

  renderEmptyData() {
    const { url, isLoading } = this.props;
    const { settingsIsShow } = this.state;

    if (url || settingsIsShow || isLoading) {
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

    const { title, url } = this.props;

    return (
      <div className="ecos-wpage__settings">
        <Label htmlFor="title-input" className="ecos-wpage__settings-label">
          {t(LABELS.SETTINGS_LABEL_TITLE)}
        </Label>
        <Input
          id="title-input"
          className="ecos-wpage__settings-input"
          placeholder={t(LABELS.SETTINGS_PLACEHOLDER_TITLE)}
          onChange={this.handleChangeTitle}
          defaultValue={title}
        />

        <Label htmlFor="url-input" className="ecos-wpage__settings-label">
          {t(LABELS.SETTINGS_LABEL_URL)}
        </Label>
        <Input
          id="url-input"
          className="ecos-wpage__settings-input"
          placeholder={t(LABELS.SETTINGS_PLACEHOLDER_URL)}
          onChange={this.handleChangeUrl}
          defaultValue={url}
        />

        <Btn className="ecos-btn_grey5 ecos-btn_hover_grey1 ecos-wpage__settings-btn" onClick={this.handleCancelEdit}>
          <span className="ecos-vj__btn-add-title">{t(LABELS.SETTINGS_BTN_CANCEL)}</span>
        </Btn>

        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={!this.canSave} onClick={this.handleSaveEdit}>
          <span className="ecos-vj__btn-add-title">{t(LABELS.SETTINGS_BTN_SAVE)}</span>
        </Btn>
      </div>
    );
  }

  renderLoading() {
    if (!this.props.isLoading) {
      return null;
    }

    return (
      <div className="ecos-wpage__ground">
        <Loader />
      </div>
    );
  }

  renderError() {
    const { error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <div className="ecos-wpage__ground">
        <div className="ecos-wpage__text">
          {t(LABELS.ERROR)}
          <br />
          {t('Сервер не найден.')}
        </div>

        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleReload}>
          <span className="ecos-vj__btn-add-title">{t(LABELS.UPDATE_BTN)}</span>
        </Btn>
      </div>
    );
  }

  renderPage() {
    const { url } = this.props;
    const { settingsIsShow } = this.state;

    if (!url || settingsIsShow) {
      return null;
    }

    // return <Iframe url={url} />;
    // return <object type="text/html" data={url}/>;
    return <embed src={url} />;
  }

  render() {
    const { title } = this.props;

    return (
      <Dashlet
        title={title || t('web-page-widget.title')}
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
        {this.renderLoading()}
        {this.renderError()}
        {this.renderPage()}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateById(state, ownProps.id) });

const mapDispatchToProps = (dispatch, ownProps) => ({
  initPage: () => dispatch(initPage(ownProps.id)),
  setPageData: data => dispatch(setPageData({ stateId: ownProps.id, data }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebPage);

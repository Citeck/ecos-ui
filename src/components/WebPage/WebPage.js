import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import debounce from 'lodash/debounce';

import { Loader, DefineHeight } from '../common';
import { Btn } from '../common/btns';
import { Label, Input } from '../common/form';
import Dashlet from '../Dashlet/Dashlet';
import { t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { initPage, setPageData, getPageData, loadedPage, reloadPageData, startLoadingPage } from '../../actions/webPage';
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
    loadedPage: PropTypes.func.isRequired,
    reloadPageData: PropTypes.func.isRequired,
    fetchIsLoading: PropTypes.bool,
    pageIsLoading: PropTypes.bool
  };

  static defaultProps = {
    url: '',
    title: '',
    fetchIsLoading: false,
    pageIsLoading: false,
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
      resizable: false,
      pageIsLoaded: false,
      hasFrameContent: false,
      title: props.title,
      url: props.url,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    console.warn('props.config => ', props.config);

    props.initPage();
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

  componentDidUpdate(prevProps) {
    const { url, title } = this.props;

    // if (url && (url !== prevProps.url)) {
    //   console.warn('url !== prevProps.url => ', url, prevProps.url)
    //   this.props.reloadPageData({ url, title });
    // }
  }

  componentWillUnmount() {
    this.handleCancelResizable.cancel();
  }

  get canSave() {
    const { title, url } = this.state;

    return title && url;
  }

  setContentHeight = contentHeight => {
    this.setState({ contentHeight, resizable: true }, this.handleCancelResizable);
  };

  handleCancelResizable = debounce(() => {
    this.setState({ resizable: false });
  }, 300);

  handleGetFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  handleEdit = () => {
    this.setState({ settingsIsShow: true });
  };

  handleReload = () => {
    const { url, title, reloadPageData } = this.props;

    reloadPageData({ url, title });
    this.setState({
      settingsIsShow: false,
      resizable: false,
      pageIsLoaded: false,
      hasFrameContent: false,
      url: '',
      title: ''
    });
  };

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
    this.setState(
      {
        settingsIsShow: false,
        pageIsLoaded: false,
        hasFrameContent: false
      },
      () => {
        const { onSave, id, setPageData } = this.props;
        const { url, title } = this.state;

        onSave(id, { config: { url, title } });
        setPageData({ url, title });
      }
    );
  };

  handleLoadFrame = event => {
    // console.warn('handleLoadFrame => ');
    this.props.loadedPage();
    this.setState({
      pageIsLoaded: true,
      hasFrameContent: Boolean(event.currentTarget.contentWindow.length)
    });
  };

  renderEmptyData() {
    const { url, fetchIsLoading, pageIsLoading } = this.props;
    const { settingsIsShow } = this.state;

    if (url || settingsIsShow || fetchIsLoading || pageIsLoading) {
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
    const { fetchIsLoading, pageIsLoading, url } = this.props;
    const { pageIsLoaded } = this.state;

    if ((!fetchIsLoading && !pageIsLoading) || pageIsLoaded) {
      return null;
    }

    return (
      <div className="ecos-wpage__ground ecos-wpage__ground_full">
        <Loader />
      </div>
    );
  }

  renderError() {
    const { error, fetchIsLoading, pageIsLoading, url } = this.props;
    const { hasFrameContent, settingsIsShow } = this.state;

    if (!error || settingsIsShow || fetchIsLoading || pageIsLoading) {
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
    const { url, title, startLoadingPage, pageIsLoading } = this.props;
    const { settingsIsShow, pageIsLoaded, hasFrameContent } = this.state;

    // console.warn('!url || settingsIsShow || (pageIsLoaded && !hasFrameContent => ', !url, settingsIsShow, pageIsLoaded, !hasFrameContent);

    if (!url || settingsIsShow) {
      // || (pageIsLoaded && !hasFrameContent)) {
      return null;
    }

    if (!pageIsLoaded && !pageIsLoading) {
      startLoadingPage();
    }

    const { userHeight = 0, resizable, contentHeight, fitHeights } = this.state;
    const fixHeight = userHeight ? userHeight : pageIsLoaded && hasFrameContent ? 572 : 203;

    return (
      <iframe
        title={title}
        src={url}
        style={{
          width: '100%',
          height: `${fixHeight}px`,
          border: 'none',
          pointerEvents: resizable ? 'none' : 'auto'
        }}
        onLoad={this.handleLoadFrame}
      />
    );
  }

  render() {
    const { title, pageIsLoaded, hasFrameContent } = this.props;
    const { isCollapsed } = this.state;

    const { userHeight = 0, resizable, contentHeight, fitHeights } = this.state;
    const fixHeight = userHeight ? userHeight : pageIsLoaded && hasFrameContent ? 572 : 203;

    return (
      <Dashlet
        title={title || t('web-page-widget.title')}
        className="ecos-wpage"
        bodyClassName="ecos-wpage__body"
        needGoTo={false}
        actionHelp={false}
        actionEdit
        actionReload
        resizable
        onResize={this.handleResize}
        onChangeHeight={this.handleChangeHeight}
        onEdit={this.handleEdit}
        onReload={this.handleReload}
        getFitHeights={this.handleGetFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Scrollbars autoHide style={{ height: contentHeight || '100%' }}>
          <DefineHeight
            className="ecos-wpage__container"
            fixHeight={fixHeight}
            maxHeight={fitHeights.max}
            minHeight={1}
            getOptimalHeight={this.setContentHeight}
          >
            <div className="ecos-wpage__container">
              {this.renderEmptyData()}
              {this.renderSettings()}
              {this.renderLoading()}
              {this.renderError()}
              {this.renderPage()}
            </div>
          </DefineHeight>
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateById(state, ownProps.id) });

const mapDispatchToProps = (dispatch, ownProps) => ({
  initPage: () => dispatch(initPage(ownProps.id)),
  getPageData: () => dispatch(getPageData(ownProps.id)),
  reloadPageData: data => dispatch(reloadPageData({ stateId: ownProps.id, data })),
  startLoadingPage: () => dispatch(startLoadingPage(ownProps.id)),
  loadedPage: () => dispatch(loadedPage(ownProps.id)),
  setPageData: data => dispatch(setPageData({ stateId: ownProps.id, data }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebPage);

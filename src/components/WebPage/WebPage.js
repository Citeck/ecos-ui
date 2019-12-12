import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import classNames from 'classnames';

import { Loader, DefineHeight } from '../common';
import { Btn } from '../common/btns';
import { Label, Input } from '../common/form';
import Dashlet from '../Dashlet/Dashlet';
import BaseWidget from '../BaseWidget';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL, MIN_WIDTH_DASHLET_LARGE } from '../../constants';
import { initPage, changePageData, loadedPage, reloadPageData, cancelPageLoading, setError } from '../../actions/webPage';
import { selectStateById } from '../../selectors/webPage';
import { t } from '../../helpers/util';

import './style.scss';

const LABELS = {
  EMPTY_DATA: 'web-page-widget.empty',
  SETTINGS_BTN: 'web-page-widget.btn.settings',
  SETTINGS_LABEL_TITLE: 'web-page-widget.settings.title-label',
  SETTINGS_PLACEHOLDER_TITLE: 'web-page-widget.settings.title-placeholder',
  SETTINGS_LABEL_URL: 'web-page-widget.settings.url-label',
  SETTINGS_PLACEHOLDER_URL: 'web-page-widget.settings.url-placeholder',
  SETTINGS_BTN_CANCEL: 'web-page-widget.btn.cancel',
  SETTINGS_BTN_SAVE: 'web-page-widget.btn.save',
  ERROR: 'web-page-widget.error',
  UPDATE_BTN: 'web-page-widget.btn.update',
  SERVER_NOT_FOUND: 'web-page-widget.error-server-not-found'
};

class WebPage extends BaseWidget {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    config: PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string
    }),
    url: PropTypes.string,
    error: PropTypes.string,
    title: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    initPage: PropTypes.func.isRequired,
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
      title: get(props, 'config.title', ''),
      url: get(props, 'config.url', ''),
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    props.initPage(props.config);
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!state.settingsIsShow) {
      if (!state.url && props.url) {
        newState.url = props.url;
      }

      if (!state.title && props.title) {
        newState.title = props.title;
      }
    }

    if (Object.keys(newState).length) {
      return newState;
    }

    return null;
  }

  componentWillUnmount() {
    this.handleCancelResizable.cancel();
  }

  get canSave() {
    const { title, url } = this.state;

    return title && url;
  }

  get isSmallSize() {
    const { width } = this.state;

    return width < MIN_WIDTH_DASHLET_LARGE;
  }

  get formattedUrl() {
    const { url } = this.props;
    let formattedUrl = url;

    if (!/^\/{2}/gim.test(formattedUrl) && !/^.*:\/\//.test(url)) {
      formattedUrl = `//${formattedUrl}`;
    }

    return formattedUrl;
  }

  setContentHeight = contentHeight => {
    this.setState({ contentHeight, resizable: true }, this.handleCancelResizable);
  };

  handleCancelResizable = debounce(() => {
    this.setState({ resizable: false });
  }, 300);

  handleEdit = () => {
    this.props.cancelPageLoading();

    this.setState({ settingsIsShow: true });
  };

  handleReload = () => {
    const { url, title, reloadPageData } = this.props;

    reloadPageData({ url, title });
    this.setState({
      settingsIsShow: false,
      resizable: false,
      pageIsLoaded: false,
      url: '',
      title: ''
    });
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
    this.handleReload();
    this.setState((state, props) => ({
      settingsIsShow: false,
      url: props.url,
      title: props.title
    }));
  };

  handleSaveEdit = () => {
    const { onSave, id, changePageData } = this.props;
    const { url, title } = this.state;

    if (!url || !title) {
      return;
    }

    onSave(id, { config: { url, title } });
    changePageData({ url, title });

    this.setState({
      settingsIsShow: false,
      pageIsLoaded: false
    });
  };

  handleLoadFrame = () => {
    if (this.state.pageIsLoaded) {
      return;
    }

    this.props.loadedPage();

    this.setState({ pageIsLoaded: true });
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
          {t(LABELS.SETTINGS_BTN)}
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

        <div className="ecos-wpage__settings-btn-wrapper">
          <Btn
            className={classNames('ecos-wpage__settings-btn', {
              'ecos-wpage__settings-btn_big': this.isSmallSize
            })}
            onClick={this.handleCancelEdit}
          >
            {t(LABELS.SETTINGS_BTN_CANCEL)}
          </Btn>

          <Btn
            className={classNames('ecos-btn_blue ecos-btn_hover_light-blue', {
              'ecos-wpage__settings-btn_big': this.isSmallSize
            })}
            disabled={!this.canSave}
            onClick={this.handleSaveEdit}
          >
            {t(LABELS.SETTINGS_BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }

  renderLoading() {
    const { fetchIsLoading, pageIsLoading } = this.props;
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

  renderPage() {
    const { url, title, error } = this.props;
    const { settingsIsShow } = this.state;

    if (!url || settingsIsShow || error) {
      return null;
    }

    const { userHeight = 0, resizable } = this.state;
    const fixHeight = userHeight ? userHeight : 203;

    return (
      <iframe
        title={title}
        src={this.formattedUrl}
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
    const { title, pageIsLoaded } = this.props;
    const { isCollapsed } = this.state;

    const { userHeight = 0, contentHeight, fitHeights } = this.state;
    const fixHeight = userHeight ? userHeight : pageIsLoaded ? 572 : 203;

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
        getFitHeights={this.setFitHeights}
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
            {this.renderEmptyData()}
            {this.renderSettings()}
            {this.renderLoading()}
            {this.renderPage()}
          </DefineHeight>
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateById(state, ownProps.id) });

const mapDispatchToProps = (dispatch, ownProps) => ({
  initPage: data => dispatch(initPage({ stateId: ownProps.id, data })),
  reloadPageData: data => dispatch(reloadPageData({ stateId: ownProps.id, data })),
  cancelPageLoading: () => dispatch(cancelPageLoading(ownProps.id)),
  loadedPage: () => dispatch(loadedPage(ownProps.id)),
  setError: data => dispatch(setError({ stateId: ownProps.id, data })),
  changePageData: data => dispatch(changePageData({ stateId: ownProps.id, data }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebPage);

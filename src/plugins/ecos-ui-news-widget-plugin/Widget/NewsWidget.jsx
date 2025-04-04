import { isFunction } from 'lodash';
import get from 'lodash/get';
import React from 'react';
import { Link } from 'react-router-dom';

import Labels from '../labels';

import { DefaultImgNews } from './DefaultImgNews';
import Settings from './Settings';

import Dashlet from '@/components/Dashlet/Dashlet';
import Records from '@/components/Records/Records'; // Ensure RecordsType is exported from the module
import { notifyFailure } from '@/components/Records/actions/util/actionUtils';
import { Loader } from '@/components/common';
import BaseWidget from '@/components/widgets/BaseWidget';
import { DashboardTypes } from '@/constants/dashboard';
import { getRecordRef } from '@/helpers/urls';
import { t } from '@/helpers/util';
import DAction from '@/services/DashletActionService';
import PageService from '@/services/PageService';

import './style.scss';

class NewsWidget extends BaseWidget {
  constructor(props) {
    super(props);

    this.recordRefFromUrl = getRecordRef() || '';

    const { dashboardId } = props;

    this.state = {
      isLoading: true,
      isOpenSettings: false,
      isTypeIdExist: false,
      error: '',
      recordRef: dashboardId === DashboardTypes.USER || !this.recordRefFromUrl ? dashboardId : null,
      news: [],
      typeId: ''
    };
  }

  componentDidMount() {
    super.componentDidMount();
    const { dashboardId } = this.props;
    if (dashboardId !== DashboardTypes.USER && this.recordRefFromUrl) {
      this.getWidgetRecordRef();
    } else {
      this.fetchNews();
    }
  }

  getWidgetRecordRef = () => {
    Records.get(this.recordRefFromUrl)
      .load('_type?id')
      .then(type => {
        if (!type) {
          this.setState({
            recordRef: this.recordRefFromUrl
          });
          return;
        }

        const [source, value] = type.split('@');
        if (!source) {
          console.error(Labels.Widget.NO_SOURCE_ERROR);
          notifyFailure(Labels.Widget.NO_SOURCE_ERROR);
          return;
        }

        const preparedType = value.split('/')[0];
        this.setState({ recordRef: preparedType }, () => this.fetchNews());
      });
  };

  fetchNews(newTypeId) {
    const { config } = this.props;
    const { recordRef } = this.state;

    const ecosTypeForRequest = newTypeId || config[recordRef]?.currentType || '';

    if (!ecosTypeForRequest) {
      this.setState({
        isLoading: false,
        isTypeIdExist: false
      });
      return;
    }

    Records.query(
      {
        ecosType: ecosTypeForRequest,
        language: 'predicate',
        query: {}
      },
      {
        id: 'id',
        text: 'text?str',
        title: '?disp',
        date: '_created|fmt("dd MMMM yyyy")',
        image: 'image.url',
        preview: 'listview:preview.url'
      }
    )
      .then(res => {
        this.setState({
          news: res.records,
          isTypeIdExist: true
        });
      })
      .catch(err => {
        this.setState({
          error: err.message
        });
      })
      .finally(_ => {
        this.setState({
          isLoading: false
        });
      });
  }

  get config() {
    const config = get(this.props, 'config');

    if (!this.state.recordRef) {
      return {};
    }
    return config[this.state.recordRef] || {};
  }

  get dashletActions() {
    const actions = {
      [DAction.Actions.SETTINGS]: {
        onClick: this.handleToggleSettings
      }
    };

    return actions;
  }
  handleToggleSettings = () => {
    this.setState(state => ({
      isOpenSettings: !state.isOpenSettings
    }));
  };

  handleCancelSettings = () => {
    this.setState({ isOpenSettings: false });
  };

  handleSaveSettings = async configToSave => {
    const { id, config, onSave } = this.props;
    const { recordRef } = this.state;

    const configFromRecordRef = config[recordRef] || {};
    const newConfig = { ...config, [recordRef]: { ...configFromRecordRef, ...configToSave } };

    if (config[recordRef]?.currentType === configToSave.currentType) {
      this.setState({
        isTypeIdExist: true
      });
      isFunction(onSave) && onSave(id, { config: newConfig }, this.handleCancelSettings);
      return;
    }

    if (configToSave.currentType) {
      const newTypeId = configToSave.currentType;
      isFunction(onSave) && onSave(id, { config: newConfig });

      this.setState({
        isLoading: true,
        typeId: newTypeId,
        isTypeIdExist: true,
        isOpenSettings: false
      });
      this.fetchNews(newTypeId);
      return;
    }

    isFunction(onSave) && onSave(id, { config: newConfig }, this.handleCancelSettings);
    this.setState({
      isTypeIdExist: false
    });
  };

  formatDateRu(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
      .format(date)
      .replace(/\sг\.$/, '');
  }

  get currentWS() {
    return Citeck.Navigator.getWorkspaceId();
  }

  goToNews = async type => {
    const config = this.config;
    const journalId = await Records.get(`emodel/type@${config.currentType}`).load('journalRef?localId');
    PageService.changeUrlLink(`/v2/journals?journalId=${journalId}&viewMode=preview-list&ws=${this.currentWS}`, { openNewTab: true });
  };

  render() {
    const { isLoading, isOpenSettings, news, isTypeIdExist, error } = this.state;
    const { config } = this.props;

    const warnings = !isOpenSettings && (
      <>
        {error && <div className="ecos-news-widget-dashlet__error">{t(error)}</div>}
        {!isTypeIdExist && <div className="ecos-news-widget-dashlet__empty">{t('Выберите тип новостей')}</div>}
        {!news.length && isTypeIdExist && <div className="ecos-news-widget-dashlet__empty">{t('Нет новостей')}</div>}
      </>
    );

    return (
      <Dashlet
        title={t('dashboard-settings.widget.news')}
        actionConfig={this.dashletActions}
        className="ecos-news-widget-dashlet"
        disableCollapse={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        goToButtonName={'Перейти'}
        needGoTo={!!news.length}
        onGoTo={() => this.goToNews()}
      >
        {isLoading && <Loader />}
        {isOpenSettings && <Settings config={this.config} onSave={this.handleSaveSettings} onCancel={this.handleCancelSettings} />}
        {warnings}

        {!isLoading && !isOpenSettings && (
          <div className="ecos-news">
            <div className="ecos-news-widget">
              {news.slice(0, 3).map((item, index) => {
                const date = this.formatDateRu(item.date);
                return (
                  <article className="ecos-news-widget-article" key={item.id}>
                    {item.image || item.preview ? (
                      <img alt="news image" src={item.image || item.preview} className="ecos-news-widget-article__image" />
                    ) : (
                      <DefaultImgNews />
                    )}

                    <Link
                      className="ecos-news-widget-article__title"
                      to={`/v2/dashboard?recordRef=emodel/${this.config.currentType}@${item.id}&ws=${this.currentWS}`}
                    >
                      {item.title}
                    </Link>
                    <span className="ecos-news-widget-article__date">{date}</span>
                    <p className="ecos-news-widget-article__description" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </Dashlet>
    );
  }
}

export default NewsWidget;

import { isFunction } from 'lodash';
import get from 'lodash/get';
import React from 'react';
import { Link } from 'react-router-dom';

import Dashlet from '../../../components/Dashlet/Dashlet';
import Records from '../../../components/Records/Records'; // Ensure RecordsType is exported from the module
import { notifyFailure } from '../../../components/Records/actions/util/actionUtils';
import { Loader } from '../../../components/common';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { DashboardTypes } from '../../../constants/dashboard';
import { getRecordRef } from '../../../helpers/urls';
import { t } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import Labels from '../labels';

import Settings from './Settings';

import './style.scss';
import { DefaultImgNews } from './DefaultImgNews';

class NewsWidget extends BaseWidget {
  constructor(props) {
    super(props);

    this.recordRefFromUrl = getRecordRef() || '';

    const { dashboardId } = props;

    this.state = {
      isLoading: true,
      isOpenSettings: false,
      recordRef: dashboardId === DashboardTypes.USER || !this.recordRefFromUrl ? dashboardId : null,
      news: []
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
        this.setState(
          {
            recordRef: preparedType
          },
          () => {
            this.fetchNews();
          }
        );
      });
  };

  fetchNews(typeIdFromSettings) {
    const { typeId } = this.config;

    const attributes = {
      id: 'id',
      text: 'text?str',
      title: '?disp',
      date: '_created|fmt("dd MMMM yyyy")',
      image: 'image.url'
    };
    const ecosTypeForRequest = typeIdFromSettings || typeId.split('@')[1];

    this.handleCancelSettings();
    Records.query({ ecosType: ecosTypeForRequest, language: 'predicate', query: {} }, attributes).then(res => {
      this.setState({
        news: res.records,
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

    const configFromRecordRef = config[this.state.recordRef] || {};

    const newConfig = { ...config, [this.state.recordRef]: { ...configFromRecordRef, ...configToSave } };

    this.fetchNews(configToSave.typeId.split('@')[1]);
    isFunction(onSave) && onSave(id, { config: newConfig }, this.handleCancelSettings);
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

  render() {
    const { isLoading, isOpenSettings, recordRef, news } = this.state;
    return (
      <Dashlet
        title={t('dashboard-settings.widget.news')}
        actionConfig={this.dashletActions}
        className="ecos-news-widget-dashlet"
        disableCollapse={false}
        needGoTo={false}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
      >
        {!news.length && !isOpenSettings && <div className="ecos-news-widget-dashlet__empty">{t('Нет новостей')}</div>}
        {isLoading && <Loader />}
        {isOpenSettings && <Settings config={this.config} onSave={this.handleSaveSettings} onCancel={this.handleCancelSettings} />}

        {!isLoading && !isOpenSettings && (
          <div className="ecos-news">
            <div className="ecos-news-widget">
              {news.slice(0, 3).map((item, index) => {
                const date = this.formatDateRu(item.date);
                return (
                  <article className="ecos-news-widget-article" key={item.id}>
                    {item.image ? (
                      <img alt="news image" src={item.image} className="ecos-news-widget-article__image" />
                    ) : (
                      <div className="ecos-news-widget-article__image">
                        <DefaultImgNews />
                      </div>
                    )}

                    <Link
                      className="ecos-news-widget-article__title"
                      to={`/v2/dashboard?recordRef=emodel/company-news@${item.id}&ws=publications-news `}
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

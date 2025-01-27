import moment from 'moment';
import React from 'react';
import get from 'lodash/get';

import Dashlet from '../../../components/Dashlet/Dashlet';
import { Loader } from '../../../components/common';
import Records from '../../../components/Records/Records';
import FormManager from '../../../components/EcosForm/FormManager';
import BaseWidget from '../../../components/widgets/BaseWidget';
import DAction from '../../../services/DashletActionService';
import { getCurrentLocale, t } from '../../../helpers/util';
import { getRecordRef } from '../../../helpers/urls';
import { getStateId } from '../../../helpers/redux';

import './style.scss';

class PublicationWidgetDashlet extends BaseWidget {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      publication: {}
    };

    this.stateId = getStateId(props);
    this.recordRefFromUrl = getRecordRef() || '';

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'title?str', 'text?str'])];
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchPublication();
  }

  fetchPublication() {
    const recordRef = this.recordRefFromUrl;

    return Records.get(recordRef)
      .load({
        id: 'id',
        text: 'text?str',
        title: '?disp',
        modified: '_modified?str',
        modifier: '_modifier{id,avatarUrl,name:?disp}',
        created: '_created?str',
        creator: '_creator{id,avatarUrl,name:?disp}'
      })
      .then(record =>
        this.setState({
          publication: record,
          isLoading: false
        })
      );
  }

  get config() {
    const config = get(this.props, 'config');

    return config[this.state.typeRef] || {};
  }

  get widgetTitle() {
    const config = this.config;

    return get(config, ['title', getCurrentLocale()]);
  }

  get dashletActions() {
    const actions = {
      [DAction.Actions.EDIT]: {
        onClick: this.toggleEdit
      }
    };

    return actions;
  }

  toggleEdit = () => {
    FormManager.openFormModal({
      record: this.recordRefFromUrl,
      saveOnSubmit: true,
      onSubmit: () => this.reload()
    });
  };

  handleUpdate() {
    super.handleUpdate();

    this.fetchPublication();
  }

  render() {
    const { isLoading, publication } = this.state;

    if (!publication) {
      return null;
    }

    const { creator = {}, modifier = {} } = publication;

    return (
      <Dashlet
        title={t('dashboard-settings.widget.publication')}
        actionConfig={this.dashletActions}
        className="ecos-publication-widget-dashlet"
        disableCollapse={true}
        needGoTo={false}
      >
        {isLoading && <Loader />}
        {!isLoading && (
          <>
            <div className="ecos-publication">
              <img className="ecos-avatar__image" src={`${creator.avatarUrl}&width=150`} alt={creator.name} />
              <div className="ecos-publication-info">
                <p className="ecos-publication-info__name">
                  <span>{t('publication.creator.name')} </span> {creator.name}
                  {creator.id !== modifier.id && (
                    <>
                      <span>{t('publication.moifier.name')} </span> {modifier.name}
                    </>
                  )}
                </p>
                <p className="ecos-publication-info__date">{moment(publication.modified).format('dddd, MMMM Do YYYY, h:mm:ss')}</p>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: publication.text }} />
          </>
        )}
      </Dashlet>
    );
  }
}

export default PublicationWidgetDashlet;

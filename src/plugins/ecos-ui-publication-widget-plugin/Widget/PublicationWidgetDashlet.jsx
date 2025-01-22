import moment from 'moment';
import React from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { getStateId } from '../../../helpers/redux';
import DAction from '../../../services/DashletActionService';
import Dashlet from '../../../components/Dashlet/Dashlet';
import { Loader } from '../../../components/common';
import Records from '../../../components/Records/Records';
import { getCurrentLocale, t } from '../../../helpers/util';
import { getRecordRef } from '../../../helpers/urls';
import { getSourceId } from '../../../components/Records/utils/recordUtils';
import FormManager from '../../../components/EcosForm/FormManager';
import BaseWidget from '../../../components/widgets/BaseWidget';
import { Labels } from './constants';

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
  }

  componentDidMount() {
    const recordRef = this.recordRefFromUrl;

    Records.queryOne(
      { recordRef: recordRef, sourceId: getSourceId(recordRef) },
      {
        id: 'id',
        text: 'text?str',
        title: '?disp',
        modified: '_modified?str',
        modifierId: '_modifier.id?str',
        modifierAvatarUrl: '_modifier.avatarUrl?str',
        modifierName: '_modifier',
        created: '_created?str',
        createdId: '_creator{id,avatarUrl,name:?disp}',
        createdAvatarUrl: '_creator.avatarUrl?str',
        createdName: '_creator'
      }
    ).then(record => this.setState({ publication: record, isLoading: false }));
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

  watchAttrsToLoad = () => {
    const { config = {} } = this.props;
    const { attrsToLoad } = config[this.state.typeRef] || {};

    if (attrsToLoad && attrsToLoad.length) {
      attrsToLoad.forEach(att => this.instanceRecord.watch(`${att.value}[]?id`, this.fetchRecordRefs));
    }
  };

  toggleEdit = () => {
    FormManager.openFormModal({
      record: this.recordRefFromUrl,
      saveOnSubmit: true,
      onSubmit: () => this.reload()
    });
  };

  onSaveWidgetSettings = async configToSave => {
    const { id, config, onSave } = this.props;

    const configFromRecordRef = config[this.state.typeRef];

    const noSavedConfig = !configFromRecordRef;
    const noNewTitle = !get(configToSave, ['title', getCurrentLocale()]);

    if (noSavedConfig || noNewTitle) {
      const journal = await Records.get(configToSave.journalId).load('.disp');
      configToSave.title = {
        [getCurrentLocale()]: t(Labels.Widget.WIDGET_TITLE, { journal })
      };
    }

    const newConfig = { ...config, [this.state.typeRef]: { ...configFromRecordRef, ...configToSave } };

    isFunction(onSave) && (await onSave(id, { config: newConfig }, this.toggleShowSettings));
  };

  onCancelWidgetSaveSettings = () => {
    this.toggleShowSettings();
  };

  render() {
    const { isLoading, publication } = this.state;

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
              <img className="ecos-avatar__image" src={`${publication.createdAvatarUrl}&width=150`} alt={publication.createdName} />
              <div className="ecos-publication-info">
                <p className="ecos-publication-info__name">
                  <span>Создал (а) </span>
                  {publication.createdName}
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

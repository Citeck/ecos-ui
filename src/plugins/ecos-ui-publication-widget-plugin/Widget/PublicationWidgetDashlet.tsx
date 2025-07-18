/* eslint-disable react/react-in-jsx-scope */
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import moment from 'moment';

import Dashlet from '../../../components/Dashlet/Dashlet';
import FormManager from '../../../components/EcosForm/FormManager';
// @ts-ignore
import Records from '../../../components/Records/Records';
import { Avatar, Loader } from '../../../components/common';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '../../../components/widgets/BaseWidget';
import { getStateId } from '../../../helpers/redux';
import DAction from '../../../services/DashletActionService';

import { getFitnesseClassName } from '@/helpers/tools';
import { getRecordRef } from '@/helpers/urls';
import { t } from '@/helpers/util';
import { Events } from '@/services/PageService';

import './style.scss';

type PublicationWidgetDashletProps = BaseWidgetProps;

export interface Publication {
  title: string;
  text: string;
  creator: Creator;
  modifier: Modifier;
  modified: string;
  hasPermissions: boolean;
}

interface Creator {
  id: string;
  avatarUrl: string;
  name: string;
}

type Modifier = Creator;

interface PublicationWidgetDashletState extends BaseWidgetState {
  isLoading: boolean;
  publication?: Publication;
  recordRef: string;
  hasPermissions: boolean;
}

class PublicationWidgetDashlet<P extends PublicationWidgetDashletProps, S extends PublicationWidgetDashletState> extends BaseWidget<P, S> {
  stateId: string;
  unlisten: any;

  constructor(props: P) {
    super(props);

    this.state = {
      isLoading: true,
      recordRef: props.record,
      publication: {},
      hasPermissions: false
    } as S;

    this.stateId = getStateId(props);

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'title?str', 'text?str'])];
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.updatePublication.bind(this));
  }

  componentDidMount() {
    super.componentDidMount();
    this.fetchPublication();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, this.updatePublication.bind(this));
  }

  updatePublication() {
    const newRecordRef = getRecordRef();

    if (newRecordRef) {
      this.setState({ recordRef: newRecordRef }, () => this.fetchPublication());
    }
  }

  fetchPublication() {
    const { recordRef } = this.state;
    // @ts-ignore
    return Records.get(recordRef)
      .load({
        id: 'id',
        text: 'text?str',
        title: '?disp',
        modified: '_modified?str',
        modifier: '_modifier{id:?localId,avatarUrl,name:?disp}',
        created: '_created?str',
        creator: '_creator{id:?localId,avatarUrl,name:?disp}',
        hasPermissions: 'permissions._has.Write?bool'
      })
      .then((record: Publication) =>
        this.setState({
          hasPermissions: record.hasPermissions,
          publication: record,
          isLoading: false
        })
      );
  }

  get widgetTitle() {
    const { recordRef, publication } = this.state;
    const [source, _value] = recordRef.split('@');

    if (source.includes('wiki')) {
      return publication?.title || t('dashboard-settings.widget.publication');
    }

    return t('dashboard-settings.widget.publication');
  }

  get dashletActions() {
    const actions = {};

    if (this.state.hasPermissions) {
      // @ts-ignore
      actions[DAction.Actions.EDIT] = {
        className: getFitnesseClassName('publication-widget', DAction.Actions.EDIT),
        onClick: this.toggleEdit
      };
    }

    return actions;
  }

  toggleEdit = () => {
    const { recordRef } = this.state;

    FormManager.openFormModal({
      record: recordRef,
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

    if (!publication || isEmpty(publication)) {
      return null;
    }

    const { creator, modifier } = publication;

    return (
      // @ts-ignore
      <Dashlet
        title={this.widgetTitle}
        actionConfig={this.dashletActions}
        className="ecos-publication-widget-dashlet"
        disableCollapse={true}
        needGoTo={false}
      >
        {isLoading && <Loader />}
        {!isLoading && (
          <>
            <div className="ecos-publication">
              <Avatar
                noBorder
                url={`${creator.avatarUrl}&width=150`}
                userName={creator.name}
                className="ecos-publications__publication-image-stack_img"
                classNameEmpty="ecos-publications__publication-avatar_empty"
              />
              <div className="ecos-publication-info">
                <p className="ecos-publication-info__name">
                  <span>{t('publication.creator.name')} </span> {creator.name}
                  {creator.id !== modifier.id && (
                    <>
                      <span>{t('publication.modifier.name')} </span> {modifier.name}
                    </>
                  )}
                </p>
                <p className="ecos-publication-info__date">{moment(publication.modified).format('dddd, MMMM Do YYYY, h:mm:ss')}</p>
              </div>
            </div>
            {isString(publication.text) && <div dangerouslySetInnerHTML={{ __html: publication.text }} />}
          </>
        )}
      </Dashlet>
    );
  }
}

export default PublicationWidgetDashlet;

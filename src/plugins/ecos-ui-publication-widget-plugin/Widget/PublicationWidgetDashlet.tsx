/* eslint-disable react/react-in-jsx-scope */
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import moment from 'moment';

import Dashlet from '../../../components/Dashlet/Dashlet';
import FormManager from '../../../components/EcosForm/FormManager';

import LexicalEditor from '@/components/LexicalEditor';
import Records from '@/components/Records/Records';
import { Avatar, Loader } from '@/components/common';
import BaseWidget, { BaseWidgetProps, BaseWidgetState, EVENTS } from '@/components/widgets/BaseWidget';
import { getStateId } from '@/helpers/store';
import { getFitnesseClassName } from '@/helpers/tools';
import { getRecordRef } from '@/helpers/urls';
import { t } from '@/helpers/util';
import DAction from '@/services/DashletActionService';
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

  private isMountedFlag = false;
  private onUrlChange: () => void;

  constructor(props: P) {
    super(props);

    const initialRef = getRecordRef() || props.record;

    this.state = {
      isLoading: true,
      recordRef: initialRef,
      publication: {} as any,
      hasPermissions: false
    } as S;

    this.stateId = getStateId(props);

    this.fetchPublication = this.fetchPublication.bind(this);
    this.updatePublication = this.updatePublication.bind(this);
    this.onUrlChange = this.updatePublication;

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'title?str', 'text?str'])];
  }

  componentDidMount() {
    super.componentDidMount();
    this.isMountedFlag = true;

    this.instanceRecord.events.on(EVENTS.ATTS_UPDATED, this.fetchPublication);
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.onUrlChange);

    this.fetchPublication();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.isMountedFlag = false;

    this.instanceRecord.events.off(EVENTS.ATTS_UPDATED, this.fetchPublication);
    document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, this.onUrlChange);
  }

  updatePublication() {
    const newRecordRef = getRecordRef() || this.props.record;
    if (!newRecordRef) return;

    if (!this.isMountedFlag) {
      return;
    }

    this.setState({ recordRef: newRecordRef }, this.fetchPublication);
  }

  fetchPublication() {
    const { recordRef } = this.state;
    if (!recordRef) return;

    if (this.isMountedFlag) this.setState({ isLoading: true });

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
    const actions: Record<string, { className: string; onClick: () => void }> = {};

    if (this.state.hasPermissions) {
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
        {...this.props}
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
            {isString(publication.text) && <LexicalEditor readonly htmlString={publication.text} />}
          </>
        )}
      </Dashlet>
    );
  }
}

export default PublicationWidgetDashlet;

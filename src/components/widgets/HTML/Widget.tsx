import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import React from 'react';
import { connect } from 'react-redux';

import Dashlet from '../../Dashlet';
import { InfoText } from '../../common';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '../BaseWidget';

import EditorCustomHtmlWidget from './Editor';
import { Labels } from './constants';

import { setEditorMode, setLoading } from '@/actions/customWidgetHtml';
import LexicalEditor from '@/components/LexicalEditor';
import { DashboardTypes } from '@/constants/dashboard';
import { t } from '@/helpers/export/util';
import { getStateId, wrapArgs } from '@/helpers/store';
import { getRecordRef } from '@/helpers/urls';
import { getCurrentLocale } from '@/helpers/util';
import { selectCustomWidgetData } from '@/selectors/customWidgetHtml';
import DAction from '@/services/DashletActionService';
import { MLTextType } from '@/types/components';
import { Dispatch, RootState } from '@/types/store';
import { MLHtmlStringType, ObjectStateWidgetHtml } from '@/types/store/customWidgetHtml';
import './styles.scss';

export interface IConfigToSave {
  title: MLTextType;
  htmlString: MLHtmlStringType;
  isWysiwygMode: boolean;
}

export interface HTMLWidgetProps extends BaseWidgetProps, ObjectStateWidgetHtml {
  onSave: (id: string, data: any, callback: () => void) => void;
  setEditorMode: (flag: boolean) => void;
  setLoading: (flag: boolean) => void;
  stateId: string;
  config: Partial<IConfigToSave> & BaseWidgetProps['config'];
}

interface HTMLWidgetState extends BaseWidgetState {
  recordRef: string;
  html: MLHtmlStringType;
}

const getKey = ({ tabId = '', stateId, id }: { tabId: string; stateId?: string; id: string }) =>
  (stateId || '').includes(tabId) && stateId === tabId ? stateId : getStateId({ tabId, id: stateId || id });

const mapStateToProps = (state: RootState, ownProps: Omit<HTMLWidgetProps, 'stateId'>) => {
  const stateId = getKey(ownProps);
  const ownState = selectCustomWidgetData(state, stateId);

  return {
    stateId,
    ...ownState
  };
};

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: Omit<HTMLWidgetProps, 'setEditorMode' | 'setLoading' | 'stateId'>
): Pick<HTMLWidgetProps, 'setEditorMode' | 'setLoading'> => {
  const w = wrapArgs<boolean>(getKey(ownProps));

  return {
    setEditorMode: isVisible => dispatch(setEditorMode(w(isVisible))),
    setLoading: isLoading => dispatch(setLoading(w(isLoading)))
  };
};

class CustomWidgetHtmlDashlet extends BaseWidget<HTMLWidgetProps, HTMLWidgetState> {
  recordRefFromUrl = getRecordRef() || '';

  constructor(props: HTMLWidgetProps) {
    super(props);

    const { dashboardId, config } = props;
    const recordRef = dashboardId === DashboardTypes.USER || !this.recordRefFromUrl ? dashboardId : this.recordRefFromUrl;

    let html = get(config, 'htmlString', {});

    if (recordRef) {
      if (isEmpty(html)) {
        html = config && get(config, recordRef) ? get(config, [recordRef, 'htmlString'], {}) : {};
      }

      this.state = {
        recordRef,
        html
      };
    }
  }

  get config(): HTMLWidgetProps['config'] {
    return get(this.props, 'config');
  }

  get title() {
    const titleFromConfig = this.config.title || Labels.Widget.DEFAULT_TITLE;

    return isString(titleFromConfig) ? titleFromConfig : titleFromConfig[getCurrentLocale()];
  }

  componentDidUpdate(prevProps: HTMLWidgetProps, prevState: HTMLWidgetState) {
    super.componentDidUpdate(prevProps, prevState);

    if (!isEqual(prevProps.config, this.config) && this.config?.htmlString) {
      this.setState({ html: this.config.htmlString });
    }
  }

  renderEditor() {
    const { isVisibleEditor, stateId } = this.props;

    if (!isVisibleEditor) {
      return null;
    }

    return <EditorCustomHtmlWidget config={this.config} onSave={this.handleSaveSettings} stateId={stateId} />;
  }

  renderContent() {
    const { isVisibleEditor, config } = this.props;
    const { html } = this.state;

    const isWysiwygMode = !!config.isWysiwygMode;

    if (isVisibleEditor || this.isCollapsed) {
      return null;
    }

    if (!get(html, getCurrentLocale())) {
      return <InfoText text={t(Labels.Widget.WARNING_NEED_SETTINGS)} />;
    }

    const parsedHtml = get(html, getCurrentLocale(), '').replace(/\{([^}]+)}/g, (_: string, code: string) => {
      try {
        return new Function(`return ${code}`)();
      } catch (error) {
        console.error('Error when executing the code:', error);
        return `{${code}}`;
      }
    });

    if (isWysiwygMode) {
      return <LexicalEditor readonly htmlString={parsedHtml} />;
    }

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  handleSaveSettings = (configToSave: IConfigToSave) => {
    const { id, config, onSave } = this.props;
    const { recordRef } = this.state;
    const configFromRecordRef = get(config, recordRef, {});

    isFunction(onSave) &&
      onSave(
        id,
        {
          config: {
            ...configFromRecordRef,
            ...configToSave
          }
        },
        this.onCloseEditor
      );
  };

  showEditor = () => this.props.setEditorMode(true);

  onCloseEditor = () => {
    this.props.setEditorMode(false);
    this.props.setLoading(false);
  };

  render() {
    const { isVisibleEditor } = this.props;

    let actions;

    if (!isVisibleEditor) {
      actions = {
        [DAction.Actions.SETTINGS]: {
          onClick: this.showEditor
        }
      };
    } else {
      actions = {};
    }

    return (
      // @ts-ignore
      <Dashlet
        className="citeck-html-widget"
        bodyClassName="citeck-html-widget__body"
        needGoTo={false}
        title={this.title}
        actionConfig={actions}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        {this.renderEditor()}
        {this.renderContent()}
      </Dashlet>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CustomWidgetHtmlDashlet);

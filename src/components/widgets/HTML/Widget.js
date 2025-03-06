import React from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { DashboardTypes } from '../../../constants/dashboard';
import { setEditorMode, setLoading } from '../../../actions/customWidgetHtml';
import { getStateId, wrapArgs } from '../../../helpers/redux';
import { selectCustomWidgetData } from '../../../selectors/customWidgetHtml';
import { InfoText } from '../../common';
import { Labels } from './util';
import { t } from '../../../helpers/export/util';
import { getCurrentLocale } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import EditorCustomHtmlWidget from './Editor';
import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet';

import './styles.scss';

const getKey = ({ tabId = '', stateId, id }) =>
  (stateId || '').includes(tabId) && stateId === tabId ? stateId : getStateId({ tabId, id: stateId || id });

const mapStateToProps = (state, ownProps) => {
  const stateId = getKey(ownProps);
  const ownState = selectCustomWidgetData(state, stateId);

  return {
    stateId,
    ...ownState
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(getKey(ownProps));

  return {
    setEditorMode: isVisible => dispatch(setEditorMode(w(isVisible))),
    setLoading: isLoading => dispatch(setLoading(w(isLoading)))
  };
};

class CustomWidgetHtmlDashlet extends BaseWidget {
  constructor(props) {
    super(props);

    const { dashboardId, config } = props;
    const recordRef = dashboardId === DashboardTypes.USER || !this.recordRefFromUrl ? dashboardId : null;
    const html = config && config[recordRef] ? get(config[recordRef], 'htmlString', null) : null;

    this.state = {
      recordRef,
      html
    };
  }

  get config() {
    const config = get(this.props, 'config');

    if (!this.state.recordRef) {
      return {};
    }

    return config[this.state.recordRef] || {};
  }

  get title() {
    const titleFromConfig = this.config.title || Labels.Widget.DEFAULT_TITLE;

    return isString(titleFromConfig) ? titleFromConfig : titleFromConfig[getCurrentLocale()];
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    if (!isEqual(prevProps.config, this.props.config)) {
      this.setState({ html: this.config?.htmlString });
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
    const { isVisibleEditor } = this.props;
    const { html } = this.state;

    if (isVisibleEditor || this.isCollapsed) {
      return null;
    }

    if (!html) {
      return <InfoText text={t(Labels.Widget.WARNING_NEED_SETTINGS)} />;
    }

    const parsedHtml = html.replace(/\{([^}]+)\}/g, (_, code) => {
      try {
        // eslint-disable-next-line
        return new Function(`return ${code}`)();
      } catch (error) {
        console.error('Error when executing the code:', error);
        return `{${code}}`;
      }
    });

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  handleSaveSettings = async configToSave => {
    const { id, config, onSave } = this.props;

    const configFromRecordRef = config[this.state.recordRef] || {};

    const newConfig = { ...config, [this.state.recordRef]: { ...configFromRecordRef, ...configToSave } };

    isFunction(onSave) && onSave(id, { config: newConfig }, this.onCloseEditor);
  };

  showEditor = () => this.props.setEditorMode(true);

  onCloseEditor = () => {
    this.props.setEditorMode(false);
    this.props.setLoading(false);
  };

  render() {
    const { isVisibleEditor } = this.props;

    const actions = {};

    if (!isVisibleEditor) {
      actions[DAction.Actions.SETTINGS] = {
        onClick: this.showEditor
      };
    }

    return (
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

CustomWidgetHtmlDashlet.propTypes = {
  setEditorMode: PropTypes.func,
  setLoading: PropTypes.func,
  config: PropTypes.object,
  onSave: PropTypes.func,
  id: PropTypes.string,
  dashboardId: PropTypes.string,
  isVisibleEditor: PropTypes.bool
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomWidgetHtmlDashlet);

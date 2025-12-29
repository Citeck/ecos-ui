import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import uniqueId from 'lodash/uniqueId';
import PropTypes from 'prop-types';
import React from 'react';
import uuidv4 from 'uuidv4';

import { Icon, InfoText, ResizeBoxes } from '../common';
import { Caption } from '../common/form';

import Tools from './Tools';
import { ToolsInterface } from './propsInterfaces';

import { PROCESS_DEF_API_ACTIONS } from '@/api/process';
import { generateKey, getData, setData } from '@/helpers/ls';
import { t } from '@/helpers/util';
import './style.scss';

const Labels = {
  NO_EDITOR: 'model-editor.error.no-editor',
  NO_FORM: 'model-editor.error.no-form',
  APPLY: 'model-editor.btn.apply',
  VIEW_XML: 'model-editor.btn.view-xml',
  SAVE_DEPLOY: 'model-editor.btn.save-deploy',
  SAVE_DRAFT: 'model-editor.btn.save-draft',
  CREATE: 'model-editor.btn.create',
  SAVE_AS_SVG: 'model-editor.btn.download-as-svg',
  RESET_ZOOM: 'model-editor.btn.reset-zoom',
  ZOOM_IN: 'model-editor.btn.zoom-in',
  ZOOM_OUT: 'model-editor.btn.zoom-out'
};

class ModelEditorWrapper extends React.Component {
  static propTypes = {
    isTableView: PropTypes.bool,
    editor: PropTypes.element,
    rightSidebar: PropTypes.element,
    rightSidebarTitle: PropTypes.string,
    onApply: PropTypes.func,
    onCreate: PropTypes.func,
    extraButtons: PropTypes.shape({
      config: PropTypes.arrayOf(PropTypes.shape(ToolsInterface)),
      zoom: PropTypes.arrayOf(PropTypes.shape(ToolsInterface))
    })
  };

  state = {
    rightSidebarOpen: true
  };

  #sidebarRightRef = React.createRef(null);
  #designerId = uniqueId('modelEditorLeftColumn_');
  #editorId = uniqueId('modelEditorRightColumn_');
  #lsKey = generateKey('bpmn-editor', true);

  constructor(props) {
    super(props);

    const sizes = getData(this.#lsKey);

    this.state = {
      rightSidebarOpen: true
    };

    if (sizes) {
      this.state.sizes = sizes;
    }
  }

  get configButtons() {
    const { extraButtons, onCreate, onViewXml, onSaveAsSVG, hasDeployRights } = this.props;
    const configButtons = [];

    const extra = get(extraButtons, 'config');

    if (isFunction(onCreate)) {
      configButtons.push({
        icon: 'icon-small-plus',
        action: onCreate,
        text: t(Labels.CREATE),
        id: `bpmn-create-btn-${uuidv4()}`,
        trigger: 'hover',
        className: ''
      });
    }

    configButtons.push({
      icon: 'fa fa-file',
      action: this.onSaveDraft,
      text: t(Labels.SAVE_DRAFT),
      id: `bpmn-save-btn-${uuidv4()}`,
      trigger: 'hover',
      className: ''
    });

    configButtons.push({
      icon: 'fa fa-save',
      action: this.onApply,
      text: t(Labels.APPLY),
      id: `bpmn-save-btn-${uuidv4()}`,
      trigger: 'hover',
      className: ''
    });

    if (hasDeployRights) {
      configButtons.push({
        icon: 'fa fa-cloud-upload',
        action: this.onSaveAndDeploy,
        text: t(Labels.SAVE_DEPLOY),
        id: `bpmn-download-btn-${uuidv4()}`,
        trigger: 'hover',
        className: 'ecos-btn_green'
      });
    }

    if (isFunction(onViewXml)) {
      configButtons.push({
        icon: 'icon-document-view',
        action: onViewXml,
        text: t(Labels.VIEW_XML),
        id: `bpmn-view-btn-${uuidv4()}`,
        trigger: 'hover',
        className: 'ecos-btn_blue'
      });
    }

    if (isFunction(onSaveAsSVG)) {
      configButtons.push({
        icon: 'icon-picture',
        action: onSaveAsSVG,
        text: t(Labels.SAVE_AS_SVG),
        id: `bpmn-download-as-svg-${uuidv4()}`,
        trigger: 'hover',
        className: ''
      });
    }

    if (!isEmpty(extra) && Array.isArray(extra)) {
      configButtons.push(...extra);
    }

    return configButtons;
  }

  get configZoomButtons() {
    const { extraButtons, onZoomIn, onZoomOut, onZoomReset, isTableView } = this.props;

    if (isTableView) {
      return [];
    }

    const configZoomButtons = [];
    const extra = get(extraButtons, 'zoom');

    if (isFunction(onZoomReset)) {
      configZoomButtons.push({
        icon: 'icon-backup',
        action: onZoomReset,
        text: t(Labels.RESET_ZOOM),
        id: `bpmn-zoom-reset-btn-${uuidv4()}`,
        trigger: 'hover',
        className: ''
      });
    }

    if (isFunction(onZoomIn)) {
      configZoomButtons.push({
        icon: 'icon-zoom-in',
        action: onZoomIn,
        text: t(Labels.ZOOM_IN),
        id: `bpmn-zoom-in-btn-${uuidv4()}`,
        trigger: 'hover',
        className: ''
      });
    }

    if (isFunction(onZoomOut)) {
      configZoomButtons.push({
        icon: 'icon-zoom-out',
        action: onZoomOut,
        text: t(Labels.ZOOM_OUT),
        id: `bpmn-zoom-out-btn-${uuidv4()}`,
        trigger: 'hover',
        className: ''
      });
    }

    if (!isEmpty(extra) && Array.isArray(extra)) {
      configZoomButtons.push(...extra);
    }

    return configZoomButtons;
  }

  onApply = () => {
    if (isFunction(this.props.onApply)) {
      this.props.onApply();
    }
  };

  onSaveDraft = () => {
    if (isFunction(this.props.onSaveDraft)) {
      this.props.onSaveDraft(PROCESS_DEF_API_ACTIONS.DRAFT);
    }
  };

  onSaveAndDeploy = () => {
    if (isFunction(this.props.onSaveAndDeploy)) {
      this.props.onSaveAndDeploy(PROCESS_DEF_API_ACTIONS.DEPLOY);
    }
  };

  togglePropertiesOpen = () => {
    this.setState(({ rightSidebarOpen }) => ({ rightSidebarOpen: !rightSidebarOpen }));
  };

  setRightSidebarRef = ref => {
    if (!ref) {
      return;
    }

    const { top = 0 } = ref.getBoundingClientRect();

    ref.style.maxHeight = `calc(100vh - ${top}px)`;
    this.#sidebarRightRef = ref;
  };

  handleResizeComplete = sizes => {
    this.setState({ sizes });
    setData(this.#lsKey, sizes);
  };

  renderEditor = () => {
    const { editor, isTableView } = this.props;
    const { rightSidebarOpen, sizes } = this.state;

    const sideBarVisible = rightSidebarOpen && !isTableView;

    return (
      <div id={this.#designerId} className="ecos-model-editor__designer" style={{ width: sideBarVisible ? get(sizes, 'left') : '' }}>
        {!editor && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_EDITOR)} />}
        {editor && (
          <div className="ecos-model-editor__designer-work-zone">
            <div className="ecos-model-editor__designer-child">{editor}</div>
            <Tools className={'ecos-model-editor__designer-buttons'} configButtons={this.configButtons} />
            <Tools className={'ecos-model-editor__designer-zoom'} configButtons={this.configZoomButtons} />
          </div>
        )}
      </div>
    );
  };

  renderSidebar = () => {
    const { rightSidebarTitle, rightSidebar, isTableView } = this.props;
    const { rightSidebarOpen, sizes } = this.state;

    const sideBarVisible = rightSidebarOpen && !isTableView;

    return (
      <div
        id={this.#editorId}
        className={classNames('ecos-model-editor__sidebar-right', {
          'ecos-model-editor__sidebar-right_open': sideBarVisible
        })}
        style={{ width: sideBarVisible ? get(sizes, 'right') : '' }}
      >
        {sideBarVisible && (
          <ResizeBoxes
            leftId={this.#designerId}
            rightId={this.#editorId}
            className="ecos-model-editor__sidebar-right-resizer"
            sizes={sizes}
            onResizeComplete={this.handleResizeComplete}
          />
        )}

        {!isTableView && (
          <div className="ecos-model-editor__sidebar-right-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !rightSidebarOpen, 'icon-small-right': rightSidebarOpen })} />
          </div>
        )}

        <div ref={this.setRightSidebarRef} className="ecos-model-editor__sidebar-right-content">
          {rightSidebarTitle && (
            <Caption normal className="ecos-model-editor__sidebar-right-caption">
              {rightSidebarTitle}
            </Caption>
          )}

          {rightSidebar}
        </div>
      </div>
    );
  };

  render() {
    return (
      <div
        className="ecos-model-editor"
        style={{ display: 'flex' }} // necessary for correct calculation of the top offset when css-files haven't had time to load yet
      >
        {this.renderEditor()}
        {this.renderSidebar()}
      </div>
    );
  }
}

export default ModelEditorWrapper;

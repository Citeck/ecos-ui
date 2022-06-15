import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';
import uuidv4 from 'uuid/v4';
import isNil from 'lodash/isNil';
import isFunction from 'lodash/isFunction';

import { t } from '../../helpers/util';
import { Icon, InfoText, ResizeBoxes } from '../common';
import { Caption } from '../common/form';
import TitlePageLoader from '../common/TitlePageLoader';
import { generateKey, getData, setData } from '../../helpers/ls';
import Tools from './Tools';
import { ToolsInterface } from './propsInterfaces';

import './style.scss';

const Labels = {
  NO_EDITOR: 'model-editor.error.no-editor',
  NO_FORM: 'model-editor.error.no-form',
  APPLY: 'model-editor.btn.apply',
  VIEW_XML: 'model-editor.btn.view-xml',
  SAVE_DEPLOY: 'model-editor.btn.save-deploy',
  CREATE: 'model-editor.btn.create',
  SAVE_AS_SVG: 'model-editor.btn.download-as-svg',
  RESET_ZOOM: 'model-editor.btn.reset-zoom',
  ZOOM_IN: 'model-editor.btn.zoom-in',
  ZOOM_OUT: 'model-editor.btn.zoom-out'
};

class ModelEditorWrapper extends React.Component {
  static propTypes = {
    editor: PropTypes.element,
    rightSidebar: PropTypes.element,
    rightSidebarTitle: PropTypes.string,
    onApply: PropTypes.func,
    onCreate: PropTypes.func,
    configButtons: PropTypes.arrayOf(PropTypes.shape(ToolsInterface))
  };

  state = {
    rightSidebarOpen: true,
    configButtons: [],
    configZoomButtons: []
  };

  #sidebarRightRef = null;
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

  componentDidMount() {
    this.createConfigTools();
  }

  onApply = () => {
    if (isFunction(this.props.onApply)) {
      this.props.onApply(false);
    }
  };

  onSaveAndDeploy = () => {
    if (isFunction(this.props.onSaveAndDeploy)) {
      this.props.onSaveAndDeploy(true);
    }
  };

  createConfigTools() {
    const { onCreate, onViewXml, onSaveAsSVG, onZoomIn, onZoomOut, onZoomReset } = this.props;

    this.setState({
      configButtons: [
        {
          icon: 'icon-small-plus',
          action: onCreate,
          text: t(Labels.CREATE),
          id: `bpmn-create-btn-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        },
        {
          icon: 'fa fa-save',
          action: this.onApply,
          text: t(Labels.APPLY),
          id: `bpmn-save-btn-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        },
        {
          icon: 'icon-document-view',
          action: onViewXml,
          text: t(Labels.VIEW_XML),
          id: `bpmn-view-btn-${uuidv4()}`,
          trigger: 'hover',
          className: 'ecos-btn_blue'
        },
        {
          icon: 'fa fa-cloud-upload',
          action: this.onSaveAndDeploy,
          text: t(Labels.SAVE_DEPLOY),
          id: `bpmn-download-btn-${uuidv4()}`,
          trigger: 'hover',
          className: 'ecos-btn_green'
        },
        {
          icon: 'icon-picture',
          action: onSaveAsSVG,
          text: t(Labels.SAVE_AS_SVG),
          id: `bpmn-download-as-svg-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        }
      ]
    });

    this.setState({
      configZoomButtons: [
        {
          icon: 'icon-backup',
          action: onZoomReset,
          text: t(Labels.RESET_ZOOM),
          id: `bpmn-zoom-reset-btn-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        },
        {
          icon: 'icon-zoom-in',
          action: onZoomIn,
          text: t(Labels.ZOOM_IN),
          id: `bpmn-zoom-in-btn-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        },
        {
          icon: 'icon-zoom-out',
          action: onZoomOut,
          text: t(Labels.ZOOM_OUT),
          id: `bpmn-zoom-out-btn-${uuidv4()}`,
          trigger: 'hover',
          className: ''
        }
      ]
    });
  }

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
    const { editor, title } = this.props;
    const { rightSidebarOpen, sizes } = this.state;

    return (
      <div id={this.#designerId} className="ecos-model-editor__designer" style={{ width: rightSidebarOpen ? get(sizes, 'left') : '' }}>
        <TitlePageLoader isReady={!isNil(title)}>
          <Caption normal className="ecos-model-editor__designer-title">
            {title}
          </Caption>
        </TitlePageLoader>
        {!editor && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_EDITOR)} />}
        {editor && (
          <div className="ecos-model-editor__designer-work-zone">
            <div className="ecos-model-editor__designer-child">{editor}</div>
            <div className="ecos-model-editor__designer-buttons">
              {this.state.configButtons && (
                <Tools className={'ecos-model-editor__designer-buttons'} configButtons={this.state.configButtons} />
              )}
            </div>
            <div className="ecos-model-editor__designer-zoom">
              {this.state.configZoomButtons && (
                <Tools className={'ecos-model-editor__designer-zoom'} configButtons={this.state.configZoomButtons} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  renderSidebar = () => {
    const { rightSidebarTitle, rightSidebar } = this.props;
    const { rightSidebarOpen, sizes } = this.state;

    return (
      <div
        id={this.#editorId}
        className={classNames('ecos-model-editor__sidebar-right', {
          'ecos-model-editor__sidebar-right_open': rightSidebarOpen
        })}
        style={{ width: rightSidebarOpen ? get(sizes, 'right') : '' }}
      >
        {rightSidebarOpen && (
          <ResizeBoxes
            leftId={this.#designerId}
            rightId={this.#editorId}
            className="ecos-model-editor__sidebar-right-resizer"
            sizes={sizes}
            onResizeComplete={this.handleResizeComplete}
          />
        )}

        <div className="ecos-model-editor__sidebar-right-opener" onClick={this.togglePropertiesOpen}>
          <Icon className={classNames({ 'icon-small-left': !rightSidebarOpen, 'icon-small-right': rightSidebarOpen })} />
        </div>

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

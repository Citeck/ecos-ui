import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import uniqueId from 'lodash/uniqueId';

import { isExistValue, t } from '../../helpers/util';
import { Icon, InfoText, ResizeBoxes } from '../common';
import { Caption } from '../common/form';
import { Btn } from '../common/btns';
import TitlePageLoader from '../common/TitlePageLoader';
import { generateKey, getData, setData } from '../../helpers/ls';

import './style.scss';

const Labels = {
  NO_EDITOR: 'model-editor.error.no-editor',
  NO_FORM: 'model-editor.error.no-form',
  APPLY: 'model-editor.btn.apply',
  VIEW_XML: 'model-editor.btn.view-xml',
  SAVE_DEPLOY: 'model-editor.btn.save-deploy',
  CREATE: 'model-editor.btn.create'
};

class ModelEditorWrapper extends React.Component {
  static propTypes = {
    editor: PropTypes.element,
    rightSidebar: PropTypes.element,
    rightSidebarTitle: PropTypes.string,
    onApply: PropTypes.func,
    onCreate: PropTypes.func
  };

  state = {
    rightSidebarOpen: true
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

  togglePropertiesOpen = () => {
    this.setState(({ rightSidebarOpen }) => {
      if (rightSidebarOpen) {
        this.#sidebarRightRef = null;
      }

      return { rightSidebarOpen: !rightSidebarOpen };
    });
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

  render() {
    const { rightSidebarTitle, editor, rightSidebar, title, onApply, onCreate, onViewXml, onSaveAndDeploy } = this.props;
    const { rightSidebarOpen, sizes } = this.state;

    return (
      <div className="ecos-model-editor" style={{ display: 'flex' }}>
        <div id={this.#designerId} className="ecos-model-editor__designer" style={{ width: rightSidebarOpen ? get(sizes, 'left') : '' }}>
          <TitlePageLoader isReady={isExistValue(title)}>
            <Caption normal className="ecos-model-editor__designer-title">
              {title}
            </Caption>
          </TitlePageLoader>
          {!editor && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_EDITOR)} />}
          {editor && (
            <div className="ecos-model-editor__designer-work-zone">
              <div className="ecos-model-editor__designer-child">{editor}</div>
              <div className="ecos-model-editor__designer-buttons">
                {onCreate && <Btn onClick={onCreate}>{t(Labels.CREATE)}</Btn>}
                {onApply && (
                  <Btn className="ecos-btn_blue" onClick={onApply}>
                    {t(Labels.APPLY)}
                  </Btn>
                )}
                {onViewXml && (
                  <Btn className="ecos-btn_blue" onClick={onViewXml}>
                    {t(Labels.VIEW_XML)}
                  </Btn>
                )}
                {onSaveAndDeploy && (
                  <Btn className="ecos-btn_green" onClick={onSaveAndDeploy}>
                    {t(Labels.SAVE_DEPLOY)}
                  </Btn>
                )}
              </div>
            </div>
          )}
        </div>

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
      </div>
    );
  }
}

export default ModelEditorWrapper;

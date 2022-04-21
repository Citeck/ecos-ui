import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';

import { isExistValue, t } from '../../helpers/util';
import { Icon, InfoText } from '../common';
import { Caption } from '../common/form';
import TitlePageLoader from '../common/TitlePageLoader';
import Tools from './Tools';

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
    onCreate: PropTypes.func,
    configButtons: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        action: PropTypes.func.isRequired,
        text: PropTypes.string,
        id: PropTypes.string.isRequired,
        trigger: PropTypes.string,
        className: PropTypes.string
      })
    )
  };

  state = {
    rightSidebarOpen: true
  };

  togglePropertiesOpen = () => {
    this.setState(({ rightSidebarOpen }) => ({ rightSidebarOpen: !rightSidebarOpen }));
  };

  render() {
    const { rightSidebarOpen } = this.state;
    const { rightSidebarTitle, editor, rightSidebar, title, onApply, onCreate, onViewXml, onSaveAndDeploy } = this.props;

    const configButtons = [
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
        action: onApply,
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
        action: onSaveAndDeploy,
        text: t(Labels.SAVE_DEPLOY),
        id: `bpmn-download-btn-${uuidv4()}`,
        trigger: 'hover',
        className: 'ecos-btn_green'
      }
    ];

    return (
      <div className="ecos-model-editor">
        <div className="ecos-model-editor__designer">
          <TitlePageLoader isReady={isExistValue(title)}>
            <Caption normal className="ecos-model-editor__designer-title">
              {title}
            </Caption>
          </TitlePageLoader>
          {!editor && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_EDITOR)} />}
          {editor && (
            <div className="ecos-model-editor__designer-work-zone">
              <div className="ecos-model-editor__designer-child">{editor}</div>
              <Tools configButtons={configButtons} />
            </div>
          )}
        </div>
        <div className={classNames('ecos-model-editor__sidebar-right', { 'ecos-model-editor__sidebar-right_open': rightSidebarOpen })}>
          <div className="ecos-model-editor__sidebar-right-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !rightSidebarOpen, 'icon-small-right': rightSidebarOpen })} />
          </div>
          <div className="ecos-model-editor__sidebar-right-content">
            {rightSidebarTitle && (
              <Caption className="mb-2" normal>
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

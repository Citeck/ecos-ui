import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { isExistValue, t } from '../../helpers/util';
import { Icon, InfoText } from '../common';
import { Caption } from '../common/form';
import { Btn } from '../common/btns';
import TitlePageLoader from '../common/TitlePageLoader';

import './style.scss';

const Labels = {
  NO_EDITOR: 'model-editor.error.no-editor',
  NO_FORM: 'model-editor.error.no-form',
  APPLY: 'model-editor.btn.apply',
  VIEW_XML: 'model-editor.btn.view-xml',
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

  togglePropertiesOpen = () => {
    this.setState(({ rightSidebarOpen }) => ({ rightSidebarOpen: !rightSidebarOpen }));
  };

  render() {
    const { rightSidebarOpen } = this.state;
    const { rightSidebarTitle, editor, rightSidebar, title, onApply, onCreate, onViewXml } = this.props;

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
              </div>
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

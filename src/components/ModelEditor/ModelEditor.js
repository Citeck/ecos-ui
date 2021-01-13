import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { isExistValue, t } from '../../helpers/util';
import EcosForm from '../EcosForm';
import { Icon, InfoText } from '../common';
import { Caption } from '../common/form';
import { Btn } from '../common/btns';
import TitlePageLoader from '../common/TitlePageLoader';

import './style.scss';

const Labels = {
  NO_RECORD: 'model-editor.error.no-record-ref',
  NO_EDITOR: 'model-editor.error.no-editor',
  NO_FORM: 'model-editor.error.no-form',
  APPLY: 'model-editor.btn.apply',
  CREATE: 'model-editor.btn.create'
};

class ModelEditor extends React.Component {
  static propTypes = {
    record: PropTypes.string,
    formId: PropTypes.string,
    formWarning: PropTypes.string,
    formTitle: PropTypes.string,
    formOptions: PropTypes.object,
    onApply: PropTypes.func,
    onCreate: PropTypes.func
  };

  state = {
    propertiesOpen: false
  };

  modelEditorRef = React.createRef();

  togglePropertiesOpen = () => {
    this.setState(({ propertiesOpen }) => ({ propertiesOpen: !propertiesOpen }));
  };

  render() {
    const { propertiesOpen } = this.state;
    const { record, formId, formWarning, formTitle, formOptions, children, title, onApply, onCreate } = this.props;
    const elEditor = this.modelEditorRef.current;
    const indentation = elEditor ? elEditor.getBoundingClientRect().top : 100;

    return (
      <div ref={this.modelEditorRef} className="ecos-model-editor" style={{ maxHeight: `calc(100vh - ${indentation}px)` }}>
        <div className="ecos-model-editor__designer">
          <TitlePageLoader isReady={isExistValue(title)}>
            <Caption normal className="ecos-model-editor__designer-title">
              {title}
            </Caption>
          </TitlePageLoader>
          {!record && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_RECORD)} />}
          {!children && <InfoText className="ecos-model-editor__info" text={t(Labels.NO_EDITOR)} />}
          {children && (
            <div className="ecos-model-editor__designer-work-zone">
              <div className="ecos-model-editor__designer-child">{children}</div>
              <div className="ecos-model-editor__designer-buttons">
                {onCreate && <Btn onClick={onCreate}>{t(Labels.CREATE)}</Btn>}
                {onApply && (
                  <Btn className="ecos-btn_blue" onClick={onApply}>
                    {t(Labels.APPLY)}
                  </Btn>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={classNames('ecos-model-editor__properties', { 'ecos-model-editor__properties_open': propertiesOpen })}>
          <div className="ecos-model-editor__properties-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !propertiesOpen, 'icon-small-right': propertiesOpen })} />
          </div>
          <div className="ecos-model-editor__properties-content">
            {formTitle && (
              <Caption className="mb-2" normal>
                {formTitle}
              </Caption>
            )}
            {!formId && <InfoText text={formWarning || t(Labels.NO_FORM)} />}
            {record && formId && <EcosForm formId={formId} record={record} options={{ ...formOptions }} />}
          </div>
        </div>
      </div>
    );
  }
}

export default ModelEditor;

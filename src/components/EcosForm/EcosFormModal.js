import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import Records from '../Records';
import IcoBtn from '../common/btns/IcoBtn';
import EcosModal from '../common/EcosModal';
import TaskAssignmentPanel from '../TaskAssignmentPanel';
import EcosFormUtils from './EcosFormUtils';
import EcosForm from './EcosForm';
import { FORM_MODE_EDIT } from './constants';

import './EcosFormModal.scss';

const LABELS = {
  CONSTRUCTOR_BTN_TOOLTIP: 'eform.btn.tooltip.constructor'
};

export default class EcosFormModal extends React.Component {
  _formRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isModalOpen: false,
      isConfigurableForm: false
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.isModalOpen !== this.state.isModalOpen) {
      if (nextProps.isModalOpen) {
        window.addEventListener('beforeunload', this._onbeforeunload);
      }

      this.setState({ isModalOpen: nextProps.isModalOpen });
    }
  }

  componentDidMount() {
    const { record, attributes = {} } = this.props;

    this.checkEditRights();
    this.instanceRecord = Records.get(record);
    this.instanceRecord
      .load({
        displayName: '.disp',
        formMode: '_formMode'
      })
      .then(recordData => {
        let typeNamePromise = Promise.resolve(null);
        if (attributes._type) {
          typeNamePromise = Records.get(attributes._type).load('name');
        } else if (attributes._etype) {
          typeNamePromise = Records.get(attributes._etype).load('name');
        }

        typeNamePromise.then(typeName => {
          if (typeName) {
            recordData.typeName = typeName;
          }

          this.setState({ recordData });
        });
      });
    this.watcher = this.instanceRecord.watch(['.disp'], changed => {
      this.setState({
        recordData: {
          ...this.state.recordData,
          displayName: changed['.disp']
        }
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._onbeforeunload);

    this.instanceRecord.unwatch(this.watcher);
  }

  handleCancel = () => {
    const { onCancelModal } = this.props;

    if (typeof onCancelModal === 'function') {
      onCancelModal();
    }

    this.setState({
      isModalOpen: false,
      recordData: null
    });
  };

  hide() {
    const { onHideModal, onAfterHideModal } = this.props;

    if (typeof onHideModal === 'function') {
      onHideModal();
    } else {
      this.setState(
        {
          isModalOpen: false,
          recordData: null
        },
        () => {
          if (typeof onAfterHideModal === 'function') {
            onAfterHideModal();
          }
        }
      );
    }

    window.removeEventListener('beforeunload', this._onbeforeunload);
  }

  checkEditRights() {
    EcosFormUtils.isConfigurableForm().then(isConfigurableForm => {
      !!isConfigurableForm && this.setState({ isConfigurableForm });
    });
  }

  _onbeforeunload = e => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#Examples
    e.preventDefault();
    e.returnValue = '';
  };

  onClickShowFormBuilder = () => {
    if (this._formRef.current) {
      this._formRef.current.onShowFormBuilder();
    }
  };

  onUpdateForm = () => {
    if (this._formRef.current) {
      this._formRef.current.onReload();
    }
  };

  renderConstructorButton() {
    const { isConfigurableForm } = this.state;

    if (!isConfigurableForm) {
      return null;
    }

    return (
      <React.Fragment key="ecos-form-modal-constructor-btn">
        <IcoBtn
          id="ecos-form-modal-constructor-btn"
          icon="icon-settings"
          className={classNames('ecos-btn_grey ecos-btn_sq_sm2 ecos-btn_hover_color-grey ml-2 ecos-form-modal__btn-settings')}
          onClick={this.onClickShowFormBuilder}
        />
        <UncontrolledTooltip
          target="ecos-form-modal-constructor-btn"
          delay={0}
          placement="top"
          className="ecos-modal-tooltip ecos-base-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {t(LABELS.CONSTRUCTOR_BTN_TOOLTIP)}
        </UncontrolledTooltip>
      </React.Fragment>
    );
  }

  renderContentBefore() {
    const { record, contentBefore } = this.props;

    if (!contentBefore && record.includes(SourcesId.TASK)) {
      return <TaskAssignmentPanel narrow taskId={record} />;
    }

    return contentBefore;
  }

  render() {
    const { title, isBigHeader, contentAfter } = this.props;
    const { recordData, isModalOpen } = this.state;

    if (!isModalOpen || !recordData) {
      return null;
    }

    const modalTitle = title || EcosFormUtils.getFormTitle(recordData, title);

    let formProps = Object.assign({}, this.props);
    let formOptions = formProps.options || {};

    formOptions['formMode'] = recordData.formMode || formOptions['formMode'] || FORM_MODE_EDIT;
    formProps['options'] = formOptions;

    formProps['onSubmit'] = (record, form, alias) => {
      this.hide();
      if (this.props.onSubmit) {
        this.props.onSubmit(record, form, alias);
      }
    };

    formProps['onFormCancel'] = (record, form) => {
      this.handleCancel();

      if (this.props.onFormCancel) {
        this.props.onFormCancel(record, form);
      }
    };

    formProps['onReady'] = (record, form) => {
      if (this.props.onReady) {
        this.props.onReady(record, form);
      }
    };

    return (
      <div>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg ecos-form-modal"
          isBigHeader={isBigHeader}
          title={modalTitle}
          isOpen={isModalOpen}
          hideModal={this.handleCancel}
          customButtons={[this.renderConstructorButton()]}
          zIndex={9000}
        >
          {this.renderContentBefore()}
          <EcosForm ref={this._formRef} onFormSubmitDone={this.onUpdateForm} initiator={{ type: 'modal' }} {...formProps} />
          {contentAfter}
        </EcosModal>
      </div>
    );
  }
}

EcosFormModal.propTypes = {
  record: PropTypes.string.isRequired,
  formId: PropTypes.string,
  formKey: PropTypes.string,
  isModalOpen: PropTypes.bool,
  isBigHeader: PropTypes.bool,
  options: PropTypes.object,
  onFormCancel: PropTypes.func,
  onCancelModal: PropTypes.func,
  onSubmit: PropTypes.func,
  onReady: PropTypes.func,
  onHideModal: PropTypes.func,
  onAfterHideModal: PropTypes.func,
  title: PropTypes.string,
  contentBefore: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  contentAfter: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
};

EcosFormModal.defaultProps = {
  isBigHeader: true,
  contentBefore: null,
  contentAfter: null
};

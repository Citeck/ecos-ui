import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { SourcesId } from '../../constants';
import Records from '../Records';
import IcoBtn from '../common/btns/IcoBtn';
import EcosModal from '../common/EcosModal';
import EcosFormUtils from './EcosFormUtils';
import EcosForm, { FORM_MODE_EDIT } from './';
import TaskAssignmentPanel from '../TaskAssignmentPanel';

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
      isAdmin: false
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

  hide() {
    const { onHideModal } = this.props;

    if (typeof onHideModal === 'function') {
      onHideModal();
    } else {
      this.setState({
        isModalOpen: false
      });
    }

    window.removeEventListener('beforeunload', this._onbeforeunload);
  }

  componentDidMount() {
    this.checkEditRights();
    this.instanceRecord = Records.get(this.props.record);
    this.instanceRecord
      .load({
        displayName: '.disp',
        formMode: '_formMode'
      })
      .then(recordData => {
        this.setState({ recordData });
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

  checkEditRights() {
    Records.query({ sourceId: SourcesId.PEOPLE }, { isAdmin: 'isAdmin?bool' }).then(result => {
      if (!Array.isArray(result.records) || result.records.length < 1) {
        return;
      }

      this.setState({ isAdmin: result.records[0].isAdmin });
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
    const { isAdmin } = this.state;

    if (!isAdmin) {
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
      return <TaskAssignmentPanel narrow executeRequest taskId={record} />;
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

    formProps['onSubmit'] = (record, form) => {
      this.hide();
      if (this.props.onSubmit) {
        this.props.onSubmit(record, form);
      }
    };

    formProps['onFormCancel'] = (record, form) => {
      this.hide();
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
          hideModal={() => this.hide()}
          customButtons={[this.renderConstructorButton()]}
          zIndex={9000}
        >
          {this.renderContentBefore()}
          <EcosForm ref={this._formRef} onFormSubmitDone={this.onUpdateForm} {...formProps} initiator={{ type: 'modal' }} />
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
  onSubmit: PropTypes.func,
  onReady: PropTypes.func,
  onHideModal: PropTypes.func,
  title: PropTypes.string,
  contentBefore: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  contentAfter: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
};

EcosFormModal.defaultProps = {
  isBigHeader: true,
  contentBefore: null,
  contentAfter: null
};

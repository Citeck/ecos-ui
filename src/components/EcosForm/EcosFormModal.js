import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';

import IcoBtn from '../common/btns/IcoBtn';
import EcosForm, { FORM_MODE_EDIT } from './EcosForm';
import EcosModal from '../common/EcosModal';
import Records from '../Records';
import { t } from '../../helpers/util';
import './EcosFormModal.scss';

const LABELS = {
  CONSTRUCTOR_BTN_TOOLTIP: 'Перейти в конструктор'
};

export default class EcosFormModal extends React.Component {
  _formRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isModalOpen: false
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
    Records.get(this.props.record)
      .load({
        displayName: '.disp',
        formMode: '_formMode'
      })
      .then(data => {
        this.setState({
          recordData: data
        });
      });
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._onbeforeunload);
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

  render() {
    const { record, title, isBigHeader } = this.props;

    let recordData = this.state.recordData;

    if (!this.state.isModalOpen || !recordData || !record) {
      return null;
    }

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
          title={title || t('eform.header.' + recordData.formMode + '.title')}
          isOpen={this.state.isModalOpen}
          hideModal={() => this.hide()}
          customButtons={[this.renderConstructorButton()]}
          zIndex={9000}
        >
          <EcosForm ref={this._formRef} onFormSubmitDone={this.onUpdateForm} {...formProps} />
        </EcosModal>
      </div>
    );
  }
}

EcosFormModal.propTypes = {
  record: PropTypes.string.isRequired,
  formKey: PropTypes.string,
  isModalOpen: PropTypes.bool,
  isBigHeader: PropTypes.bool,
  options: PropTypes.object,
  onFormCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  onReady: PropTypes.func,
  onHideModal: PropTypes.func,
  title: PropTypes.string
};

EcosFormModal.defaultProps = {
  isBigHeader: true
};

import React from 'react';
import classNames from 'classnames';
import IcoBtn from '../common/btns/IcoBtn';

import EcosForm from './EcosForm';
import EcosModal from '../common/EcosModal';
import Records from '../Records';
import { t } from '../../helpers/util';

export default class EcosFormModal extends React.Component {
  _formRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isModalOpen: true
    };
  }

  hide() {
    this.setState({
      isModalOpen: false
    });
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
      <IcoBtn
        key="constructor-btn"
        icon="icon-settings"
        className={classNames('ecos-btn_grey ecos-btn_sq_sm ecos-btn_hover_color-grey ml-2')}
        onClick={this.onClickShowFormBuilder}
      />
    );
  }

  render() {
    const record = this.props.record;

    let recordData = this.state.recordData;

    if (!this.state.isModalOpen || !recordData || !record) {
      return null;
    }

    let formProps = Object.assign({}, this.props);

    let formOptions = formProps.options || {};
    formOptions['formMode'] = recordData.formMode;
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

    let title = t('eform.header.' + recordData.formMode + '.title');

    return (
      <div>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg"
          isBigHeader={true}
          title={title}
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

import React, { Fragment } from 'react';

import EcosForm from './EcosForm';
import EcosModal from '../common/EcosModal';
import Records from '../Records';
import { t } from '../../helpers/util';

export default class EcosFormModal extends React.Component {
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

  render() {
    const record = this.props.record;

    let recordData = this.state.recordData;

    if (!this.state.isModalOpen || !recordData || !record) {
      return <Fragment />;
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
      //setTimeout(function (record, form) {
      //}, 100);
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
        >
          <EcosForm {...formProps} />
        </EcosModal>
      </div>
    );
  }
}

import React from 'react';

import EcosFormBuilder from './EcosFormBuilder';
import EcosModal from '../../common/EcosModal';
import cloneDeep from 'lodash/cloneDeep';

export default class EcosFormBuilderModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formDefinition: {},
      isModalOpen: false
    };
  }

  show(formDefinition) {
    this.setState({
      isModalOpen: true,
      formDefinition: cloneDeep(formDefinition)
    });
  }

  hide() {
    this.setState({
      isModalOpen: false
    });
  }

  toggleVisibility() {
    this.setState({
      isModalOpen: !this.state.isModalOpen
    });
  }

  onSubmit(formDefinition) {
    if (this.props.onSubmit) {
      this.props.onSubmit(formDefinition);
    }
    this.hide();
  }

  render() {
    let onSubmit = this.onSubmit.bind(this);
    let toggleVisibility = this.toggleVisibility.bind(this);

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-extra-lg"
        isBigHeader={false}
        title={'Form Builder'}
        isOpen={this.state.isModalOpen}
        hideModal={toggleVisibility}
        zIndex={9000}
      >
        <EcosFormBuilder formDefinition={this.state.formDefinition} onSubmit={onSubmit} onCancel={toggleVisibility} />
      </EcosModal>
    );
  }
}

import React from 'react';

import EcosFormLocaleEditor from './EcosFormLocaleEditor';
import EcosModal from '../../common/EcosModal';

export default class FormLocaleEditorModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      i18n: {},
      isModalOpen: false
    };
  }

  show(i18n, onSubmit) {
    this.setState({
      isModalOpen: true,
      i18n: i18n,
      onSubmit
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

  onSubmit(i18n) {
    if (this.state.onSubmit) {
      this.state.onSubmit(i18n);
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
        title={'Edit Locale'}
        isOpen={this.state.isModalOpen}
        hideModal={toggleVisibility}
        zIndex={9000}
      >
        <EcosFormLocaleEditor i18n={this.state.i18n} onSubmit={onSubmit} onCancel={toggleVisibility} />
      </EcosModal>
    );
  }
}

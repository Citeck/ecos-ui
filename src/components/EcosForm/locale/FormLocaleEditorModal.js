import React from 'react';

import { t } from '../../../helpers/util';
import EcosModal from '../../common/EcosModal';
import EcosFormLocaleEditor from './EcosFormLocaleEditor';

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
      i18n,
      onSubmit
    });
  }

  hide() {
    this.setState({
      isModalOpen: false
    });
  }

  onToggleVisibility = () => {
    this.setState({
      isModalOpen: !this.state.isModalOpen
    });
  };

  onSubmit = i18n => {
    if (this.state.onSubmit) {
      this.state.onSubmit(i18n);
    }
    this.hide();
  };

  render() {
    const { isModalOpen, i18n } = this.state;

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-extra-lg"
        title={t('eform.modal.title.edit-locale')}
        isOpen={isModalOpen}
        hideModal={this.onToggleVisibility}
        zIndex={9000}
      >
        <EcosFormLocaleEditor i18n={i18n} onSubmit={this.onSubmit} onCancel={this.onToggleVisibility} />
      </EcosModal>
    );
  }
}

import React from 'react';
import PropTypes from 'prop-types';
import EcosForm from '../EcosForm';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';

class PropsEditModal extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired
  };

  static defaultProps = {
    closeModal: () => {}
  };

  componentDidMount() {
    this.getTitle();
  }

  getTitle() {
    // const { record } = this.props;
    // const [setDisplayName] = useState('');
    //
    // useEffect(() => {
    //   Records.get(record)
    //     .load('.disp')
    //     .then(disp => setDisplayName(disp));
    // }, [record, setDisplayName]);
  }

  render() {
    const { record, isOpen, closeModal } = this.props;
    /*const [displayName = ''] = useState();*/

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-lg"
        isBigHeader={true}
        title={`${t('ecos-table-form.edit-modal.title')}`}
        isOpen={isOpen}
        hideModal={closeModal}
      >
        <EcosForm record={record} onSubmit={closeModal} onFormCancel={closeModal} />
      </EcosModal>
    );
  }
}

export default PropsEditModal;

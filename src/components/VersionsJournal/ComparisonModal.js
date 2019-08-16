import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import EcosModal from '../common/EcosModal';
import { VERSIONS } from '../../constants/versionsJournal';
import { Icon } from '../common';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';

const LABELS = {
  DOWNLOAD: 'Скачать'
};

class ComparisonModal extends Component {
  static propTypes = {
    versions: PropTypes.array,
    comparison: PropTypes.string.isRequired,
    isShow: PropTypes.bool,
    isLoading: PropTypes.bool,
    onHideModal: PropTypes.func
  };

  static defaultProps = {
    versions: [],
    isShow: false,
    isLoading: false,
    onHideModal: () => {}
  };

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({});
  };

  renderHeader() {
    const { versions } = this.props;

    if (!versions.length) {
      return null;
    }

    return (
      <div className="vj-modal-comparison__header">
        {versions.map(item => (
          <div className="vj-modal-comparison__header-item" key={item.id}>
            <div className="vj-modal-comparison__header-version">{item.version}</div>
            <div className="vj-modal-comparison__header-date">{item.date}</div>
            <div className="vj-modal-comparison__header-author">
              <Icon className="icon-User_avatar vj-modal-comparison__header-author-icon" />
              <div className="vj-modal-comparison__header-author-name">{item.userName}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderBody() {
    const { comparison, versions } = this.props;

    return (
      <Scrollbars autoHeight autoHeightMin="100px" autoHeightMax="80vh">
        <div className="vj-modal-comparison__body">
          <div className="vj-modal-comparison__document">
            <div className="vj-modal-comparison__document-content" dangerouslySetInnerHTML={{ __html: comparison }} />
            <a href={versions[0].url} download data-external>
              <Btn className="ecos-btn_grey5 ecos-btn_narrow vj-modal-comparison__document-btn" onClick={this.handleToggleAddModal}>
                <Icon className="icon-download vj-modal-comparison__document-btn-icon" />
                <span className="vj-modal-comparison__document-btn-title">{t(LABELS.DOWNLOAD)}</span>
              </Btn>
            </a>
          </div>
          <div className="vj-modal-comparison__document">
            <div
              className="vj-modal-comparison__document-content vj-modal-comparison__document-content_right"
              dangerouslySetInnerHTML={{ __html: comparison }}
            />
            <a href={versions[1].url} download data-external>
              <Btn className="ecos-btn_grey5 ecos-btn_narrow vj-modal-comparison__document-btn" onClick={this.handleToggleAddModal}>
                <Icon className="icon-download vj-modal-comparison__document-btn-icon" />
                <span className="vj-modal-comparison__document-btn-title">{t(LABELS.DOWNLOAD)}</span>
              </Btn>
            </a>
          </div>
        </div>
      </Scrollbars>
    );
  }

  render() {
    const { isShow, isLoading } = this.props;

    return (
      <EcosModal isOpen={isShow} isLoading={isLoading} hideModal={this.handleHideModal} className="vj-modal-comparison" isEmptyTitle>
        {this.renderHeader()}
        {this.renderBody()}
      </EcosModal>
    );
  }
}

export default ComparisonModal;

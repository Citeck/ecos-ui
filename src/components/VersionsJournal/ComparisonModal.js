import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';

import EcosModal from '../common/EcosModal';
import { Icon, Tabs } from '../common';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE } from '../../constants';

const LABELS = {
  DOWNLOAD: 'versions-journal-widget.modal.download'
};

class ComparisonModal extends Component {
  static propTypes = {
    versions: PropTypes.array,
    comparison: PropTypes.string.isRequired,
    isShow: PropTypes.bool,
    isLoading: PropTypes.bool,
    isMobile: PropTypes.bool,
    onHideModal: PropTypes.func
  };

  static defaultProps = {
    versions: [],
    isShow: false,
    isLoading: false,
    usMobile: false,
    onHideModal: () => {}
  };

  state = {
    selected: 0,
    width: 290
  };

  get isSmall() {
    const { isMobile } = this.props;
    const { width } = this.state;
    const isSmall = width <= MIN_WIDTH_DASHLET_LARGE;

    return isMobile || isSmall;
  }

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({});
  };

  handleResize = width => {
    this.setState({ width });
  };

  handleClickTab = (selected = 0) => {
    this.setState({ selected });
  };

  renderHeader() {
    const { versions } = this.props;

    if (!versions.length) {
      return null;
    }

    if (this.isSmall) {
      const { selected } = this.state;
      const item = versions[selected];

      return (
        <div className="vj-modal-comparison__header vj-modal-comparison__header_small">
          <div className="vj-modal-comparison__header-date">{item.date}</div>
          <div className="vj-modal-comparison__header-author">
            <Icon className="icon-User_avatar vj-modal-comparison__header-author-icon" />
            <div className="vj-modal-comparison__header-author-name">{item.userName}</div>
          </div>
        </div>
      );
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

    if (this.isSmall) {
      const { selected } = this.state;

      return (
        <Scrollbars autoHeight autoHeightMin="100px" autoHeightMax="80vh" key="content">
          <div className="vj-modal-comparison__body">
            <div className="vj-modal-comparison__document">
              <div
                className={classNames('vj-modal-comparison__document-content', {
                  'vj-modal-comparison__document-content_right': selected
                })}
                dangerouslySetInnerHTML={{ __html: comparison }}
              />
            </div>
          </div>
        </Scrollbars>
      );
    }

    return (
      <Scrollbars autoHeight autoHeightMin="100px" autoHeightMax="80vh">
        <div className="vj-modal-comparison__body">
          <div className="vj-modal-comparison__document">
            <div className="vj-modal-comparison__document-content" dangerouslySetInnerHTML={{ __html: comparison }} />
            <a href={versions[0].url} download data-external>
              <Btn className="ecos-btn_grey5 ecos-btn_narrow vj-modal-comparison__document-btn">
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
              <Btn className="ecos-btn_grey5 ecos-btn_narrow vj-modal-comparison__document-btn">
                <Icon className="icon-download vj-modal-comparison__document-btn-icon" />
                <span className="vj-modal-comparison__document-btn-title">{t(LABELS.DOWNLOAD)}</span>
              </Btn>
            </a>
          </div>
        </div>
      </Scrollbars>
    );
  }

  renderFooter() {
    if (!this.isSmall) {
      return null;
    }

    const { versions } = this.props;
    const { selected } = this.state;

    return (
      <div className="vj-modal-comparison__footer">
        <a href={versions[selected].url} download data-external>
          <Btn className="ecos-btn_grey5 ecos-btn_narrow vj-modal-comparison__footer-btn">
            <Icon className="icon-download vj-modal-comparison__document-btn-icon" />
            <span className="vj-modal-comparison__document-btn-title">{t(LABELS.DOWNLOAD)}</span>
          </Btn>
        </a>

        <Tabs
          items={versions}
          valueField="version"
          valuePrefix="v."
          className="vj-modal-comparison__tabs"
          activeTabKey={get(versions, [selected, 'id'])}
          onClick={this.handleClickTab}
        />
      </div>
    );
  }

  render() {
    const { isShow, isLoading } = this.props;

    return (
      <EcosModal
        isOpen={isShow}
        isLoading={isLoading}
        hideModal={this.handleHideModal}
        className={classNames('vj-modal-comparison', {
          'vj-modal-comparison_small': this.isSmall
        })}
        isEmptyTitle
        onResize={this.handleResize}
      >
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </EcosModal>
    );
  }
}

export default ComparisonModal;

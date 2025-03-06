import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import EcosModal from './EcosModal';

const EMPTY_HEADER_TITLE = ' ';

class ModalWrapper extends React.Component {
  state = {
    isOpen: true
  };

  componentDidMount() {
    if (typeof this.props.getInstance === 'function') {
      this.props.getInstance(this);
    }
  }

  close = callback => {
    this.setState(
      {
        isOpen: false
      },
      () => {
        if (typeof this.props.onHideModal === 'function') {
          this.props.onHideModal();
        }
        if (typeof callback === 'function') {
          callback();
        }
      }
    );
  };

  render() {
    let classNames = [];
    if (this.props.className) {
      classNames.push(this.props.className);
    }
    if (this.props.title === EMPTY_HEADER_TITLE) {
      classNames.push('ecos-modal_empty-header');
    }

    return (
      <EcosModal
        isOpen={this.state.isOpen}
        hideModal={this.close}
        title={this.props.title}
        isBigHeader={this.props.isBigHeader}
        className={classNames.join(' ')}
        classNameBody={this.props.classNameBody}
        reactstrapProps={this.props.reactstrapProps}
        size={this.props.size}
      >
        {this.props.children}
      </EcosModal>
    );
  }
}

ModalWrapper.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classNameBody: PropTypes.string,
  title: PropTypes.string,
  onHideModal: PropTypes.func,
  getInstance: PropTypes.func,
  reactstrapProps: PropTypes.object
};

class Modal {
  create = (Component, props) => {
    if (!Component) {
      return;
    }

    this.onHideModal = () => {
      this.destroy();

      if (isFunction(props.onHideModal)) {
        props.onHideModal();
      }
    };

    this.mountContainer();

    let modal = ReactDOM.render(
      <Component
        {...props}
        onAfterHideModal={() => {
          if (isFunction(props.onAfterHideModal)) {
            props.onAfterHideModal();
          }

          this.destroy();
          modal = null;
        }}
      />,
      this.el
    );

    this.modal = {
      close: () => {
        if (modal && isFunction(modal.hide)) {
          modal.hide.call(modal);
        }
      }
    };
  };

  mountContainer = () => {
    if (!this.el) {
      this.el = document.createElement('div');
    }

    document.body.appendChild(this.el);
  };

  open = (node, config = {}, callback) => {
    const contentBefore = get(config, 'params.contentBefore', null);
    const contentAfter = get(config, 'params.contentAfter', null);

    this.mountContainer();

    if (config.rawHtml) {
      node = <div dangerouslySetInnerHTML={{ __html: node }} />;
    }

    const root = createRoot(this.el);

    this.onHideModal = () => {
      this.destroy(root);

      if (isFunction(config.onHideModal)) {
        config.onHideModal();
      }
    };

    root.render(
      <ModalWrapper
        title={config.title || config.header || EMPTY_HEADER_TITLE}
        isBigHeader={config.isBigHeader}
        className={config.class}
        classNameBody={config.classBody}
        onHideModal={this.onHideModal}
        getInstance={el => (this.modal = el)}
        reactstrapProps={config.reactstrapProps}
        size={config.size}
      >
        {isFunction(contentBefore) ? contentBefore() : contentBefore}
        {node}
        {isFunction(contentAfter) ? contentAfter() : contentAfter}
      </ModalWrapper>
    );

    if (callback) {
      callback();
    }
  };

  close = callback => {
    this.modal.close(callback);
  };

  destroy = root => {
    if (!this.el) {
      return;
    }

    if (root) {
      root.unmount();
    }

    document.body.removeChild(this.el);
    this.el = null;
  };
}

export default Modal;

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom/client';

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
  _modalRef = null;
  _root = null;

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

    this._modalRef = React.createRef();

    this._root = ReactDOM.createRoot(this.el);
    this._root.render(
      <Component
        {...props}
        forwardRef={this._modalRef}
        onAfterHideModal={() => {
          if (isFunction(props.onAfterHideModal)) {
            props.onAfterHideModal();
          }

          this.destroy();
        }}
      />
    );

    setTimeout(() => {
      this.modal = {
        close: () => {
          if (this._modalRef?.current && isFunction(this._modalRef?.current?.hide)) {
            this._modalRef?.current?.hide();
          }
        }
      };
    }, 0);
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

    this.onHideModal = () => {
      this.destroy();

      if (isFunction(config.onHideModal)) {
        config.onHideModal();
      }
    };

    this._root = ReactDOM.createRoot(this.el);
    this._root.render(
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

    setTimeout(() => {
      if (isFunction(callback)) {
        callback();
      }
    }, 0);
  };

  close = callback => {
    this.modal.close(callback);
  };

  destroy = () => {
    if (!this.el || !this._root) {
      return;
    }

    setTimeout(() => {
      this._root.unmount();
    }, 0);

    document.body.removeChild(this.el);
    this.el = null;
  };
}

export default Modal;

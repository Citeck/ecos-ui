import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import SimpleModal from '../../../src/components/common/SimpleModal';

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

  close = () => {
    this.setState({
      isOpen: false
    }, () => {
      if (typeof this.props.onHideModal === 'function') {
        this.props.onHideModal();
      }
    });
  };

  render() {
    let classNames = [];
    if (this.props.className) {
      classNames.push(this.props.className);
    }
    if (this.props.title === EMPTY_HEADER_TITLE) {
      classNames.push('simple-modal_empty-header');
    }

    return (
      <SimpleModal
        isOpen={this.state.isOpen}
        hideModal={this.close}
        title={this.props.title}
        className={classNames.join(' ')}
      >
        {this.props.children}
      </SimpleModal>
    );
  }
}

ModalWrapper.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
  onHideModal: PropTypes.func,
  getInstance: PropTypes.func,
};

class Modal {
  open = (node, config = {}) => {
    this.el = document.createElement('div');
    document.body.appendChild(this.el);

    if (config.rawHtml) {
      node = <div dangerouslySetInnerHTML={{__html: node}} />
    }

    ReactDOM.render(
      <ModalWrapper
        title={config.title || config.header || EMPTY_HEADER_TITLE}
        className={config.class}
        onHideModal={this.destroy}
        getInstance={el => this.modal = el}
      >
        {node}
      </ModalWrapper>,
      this.el
    );
  };

  close = () => {
    this.modal.close();
  };

  destroy = () => {
    ReactDOM.unmountComponentAtNode(this.el);
    document.body.removeChild(this.el);
  };
}

export default Modal;

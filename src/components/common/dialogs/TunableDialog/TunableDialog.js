import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { EcosModal } from '../../';

import './style.scss';

class TunableDialog extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    bodyClassName: PropTypes.string,
    footerClassName: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.oneOf(PropTypes.element, PropTypes.string),
    footer: PropTypes.arrayOf(PropTypes.element),
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
  };

  static defaultProps = {
    className: '',
    bodyClassName: '',
    footerClassName: '',
    title: '',
    content: '',
    footer: [],
    isOpen: false,
    onClose: () => null
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { title, content, footer, className, bodyClassName, footerClassName, isOpen } = this.props;

    const cssClasses = classNames('ecos-tune-dialog ecos-modal_width-sm', className);
    const bodyCssClasses = classNames('ecos-tune-dialog__body', bodyClassName);
    const footerCssClasses = classNames('ecos-tune-dialog__footer', footerClassName);

    return (
      <EcosModal title={title} isOpen={isOpen} hideModal={this.onClose} className={cssClasses} noDraggable>
        {!isEmpty(content) && <div className={bodyCssClasses}>{content}</div>}

        {!isEmpty(footer) && <div className={footerCssClasses}>{footer}</div>}
      </EcosModal>
    );
  }
}

export default TunableDialog;

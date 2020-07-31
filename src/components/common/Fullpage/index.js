import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { Icon } from '../';

import './style.scss';

export default class Fullpage extends React.Component {
  static propTypes = {
    onClose: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.el = document.createElement('div');
    this.el.classList.add('ecos-fullpage');
  }

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentWillUnmount() {
    document.body.removeChild(this.el);
  }

  onClose = () => {
    this.props.onClose && this.props.onClose();
  };

  render() {
    return ReactDOM.createPortal(
      <>
        {this.props.children}
        <div className="ecos-fullpage__btn-close" onClick={this.onClose}>
          <Icon className="icon-small-close" />
        </div>
      </>,
      this.el
    );
  }
}

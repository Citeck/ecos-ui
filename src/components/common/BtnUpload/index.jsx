import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';

import PointsLoader from '../PointsLoader/PointsLoader';

import './style.scss';

class BtnUpload extends Component {
  _inputRef = React.createRef();

  handleFiles = () => {
    const files = get(this._inputRef, 'current.files', []);

    this.props.onSelected && this.props.onSelected(files);
    this._inputRef.current.value = '';
  };

  render() {
    const { className, disabled, loading, label, multiple, accept } = this.props;
    const htmlId = uniqueId('ecos-btn-upload-id--');

    return (
      <div className={classNames('ecos-btn-upload', className)}>
        <input
          ref={this._inputRef}
          type="file"
          id={htmlId}
          className="ecos-btn-upload-input"
          hidden
          multiple={multiple}
          accept={accept}
          disabled={disabled || loading}
          onChange={this.handleFiles}
        />
        <label htmlFor={htmlId} className="ecos-btn-upload-label">
          {loading && <PointsLoader />}
          {!loading && label}
        </label>
      </div>
    );
  }
}

BtnUpload.propTypes = {
  className: PropTypes.string,
  accept: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  multiple: PropTypes.bool
};

export default BtnUpload;

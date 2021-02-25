import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import omit from 'lodash/omit';
import get from 'lodash/get';

import { Input } from '../../../../../common/form';
import { EDITOR_SCOPE } from '../../constants';

class BaseEditorView extends React.Component {
  constructor(props) {
    super(props);
    this._value = get(this.props, 'extraProps.value', props.defaultValue);
  }

  get isMultiple() {
    return get(this.props, 'extraProps.editorServiceProps.column.multiple', false);
  }

  getValue() {
    return this._value;
  }

  setValue(value) {
    return (this._value = value);
  }

  handleChange = e => {
    this.setValue(e.target.value);
  };

  render() {
    const { className } = this.props;
    const props = omit(this.props, ['extraProps', 'onUpdate', 'className']);
    const inputClassNames = classNames('ecos-input_grid-editor', className);

    return <Input type="text" {...props} className={inputClassNames} onChange={this.handleChange} autoFocus />;
  }
}

BaseEditorView.propTypes = {
  className: PropTypes.string,
  defaultValue: PropTypes.any,
  extraProps: PropTypes.shape({
    editorServiceProps: PropTypes.shape({
      editorProps: PropTypes.object,
      value: PropTypes.any,
      row: PropTypes.object,
      column: PropTypes.object,
      rowIndex: PropTypes.number,
      columnIndex: PropTypes.number,
      newEditor: PropTypes.object
    }),
    value: PropTypes.any,
    scope: PropTypes.oneOf(Object.values(EDITOR_SCOPE)),
    config: PropTypes.object
  }),
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onUpdate: PropTypes.func,
  style: PropTypes.object
};

export default BaseEditorView;

import React from 'react';
import get from 'lodash/get';

import { Btn } from '../../../../components/common/btns';
import { t } from '../../../../helpers/export/util';

class Button extends React.Component {
  fileRef = React.createRef();

  handleClick = () => {
    const input = get(this.fileRef, 'current');

    if (input) {
      input.value = '';
      input.click();
    }
  };

  handleChange = () => {
    const { onChange } = this.props;
    const files = get(this.fileRef, 'current.files');

    if (typeof onChange === 'function') {
      onChange(files);
    }
  };

  render() {
    const { onChange, className, isDisabled, label, multiple } = this.props;

    return (
      <>
        <input
          type="file"
          tabIndex="-1"
          onChange={onChange}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0
          }}
          ref={this.fileRef}
          multiple={multiple}
        />
        <Btn className={className} onClick={this.handleClick} disabled={isDisabled} withoutBaseClassName>
          {t(label)}
        </Btn>
      </>
    );
  }
}

export default Button;

import React, { Component } from 'react';

import { Label, Input } from '../../common/form';
import { InputSymbol } from '../../common/form/Input';

class Settings extends Component {
  render() {
    return (
      <div className="ecos-barcode-settings">
        <Label htmlFor="my-input" className="ecos-barcode-settings__label">
          Тип кода
        </Label>
        <Input id="my-input" />
        <InputSymbol end="%" />
      </div>
    );
  }
}

export default Settings;

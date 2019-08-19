import Base from 'formiojs/components/base/Base';
import Checkbox from 'formiojs/components/checkbox/Checkbox';

// TODO delete when will fixed in new formiojs version
Checkbox.prototype.updateValue = function(flags, value) {
  if (this.isRadioCheckbox) {
    if (value === undefined && this.input.checked) {
      // Force all siblings elements in radio group to unchecked
      this.getRadioGroupItems()
        .filter(c => c !== this && c.input.checked)
        .forEach(c => (c.input.checked = false));

      value = this.component.value;
    } else {
      value = this.getRadioGroupValue();
    }
  } else if (flags && flags.modified && this.input.checked && value === undefined) {
    value = true;
  }

  const changed = Base.prototype.updateValue.call(this, flags, value);

  // it's fix
  if (!this.input) {
    return changed;
  }

  if (this.input.checked) {
    this.input.setAttribute('checked', true);
    this.addClass(this.element, 'checkbox-checked');
  } else {
    this.input.removeAttribute('checked');
    this.removeClass(this.element, 'checkbox-checked');
  }

  return changed;
};

import FormioJsTabs from 'formiojs/components/tabs/Tabs';
import Base from 'formiojs/components/base/Base';
import _ from 'lodash';

//Override formio tabs to fix inner
//validation errors which are not displayed on submit
//see https://github.com/formio/formio.js/issues/1249
export default class Tabs extends FormioJsTabs {
  getAllComponents() {
    // If the tabs errors are set, then this usually means we are getting the components that have
    // triggered errors and need to display them.
    if (this.tabsErrors && this.tabsErrors.length) {
      const comp = [
        {
          errors: this.tabsErrors
        }
      ];
      this.tabsErrors = [];
      return comp;
    }
    return super.getAllComponents();
  }

  checkValidity(data, dirty) {
    if (!dirty) {
      return super.checkValidity(data, dirty);
    }

    if (!this.checkCondition(null, data)) {
      this.setCustomValidity('');
      return true;
    }

    const isValid = Base.prototype.checkValidity.call(this, data, dirty);

    this.tabsErrors = [];
    return this.component.components.reduce((check, comp) => {
      const tabComp = _.clone(comp);
      tabComp.type = 'panel';
      tabComp.internal = true;
      const component = this.createComponent(tabComp);

      const valid = component.checkValidity(data, dirty) && check;
      this.tabsErrors = this.tabsErrors.concat(component.errors || []);
      component.destroy();
      return valid;
    }, isValid);
  }
}

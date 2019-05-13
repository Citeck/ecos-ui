import FormioJsTabs from 'formiojs/components/tabs/Tabs';
import Base from 'formiojs/components/base/Base';
import _ from 'lodash';

export default class Tabs extends FormioJsTabs {
  getAllComponents() {
    // If the validity tabs are set, then this usually means we are getting the components that have
    // triggered errors and need to iterate through these to display them.
    if (this.validityTabs && this.validityTabs.length) {
      const comps = this.validityTabs.reduce((components, component) => {
        if (component && component.getAllComponents) {
          component = component.getAllComponents();
        }
        return components.concat(component);
      }, []);
      this.validityTabs = [];
      return comps;
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
    this.validityTabs = [];
    return this.component.components.reduce((check, comp) => {
      const tabComp = _.clone(comp);
      tabComp.type = 'panel';
      tabComp.internal = true;
      const component = this.createComponent(tabComp);
      this.validityTabs.push(component);
      const valid = component.checkValidity(data, dirty) && check;
      component.destroy();
      return valid;
    }, isValid);
  }
}

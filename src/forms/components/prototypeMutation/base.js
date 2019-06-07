import Base from 'formiojs/components/base/Base';

const originalCreateTooltip = Base.prototype.createTooltip;

Base.prototype.createTooltip = function(container, component, classes) {
  originalCreateTooltip.call(this, container, component, classes);

  if (this.tooltip) {
    this.tooltip.updateTitleContent(this.t(this.tooltip.options.title));
  }
};

import FormIODateTimeComponent from 'formiojs/components/datetime/DateTime';

export default class DateTimeComponent extends FormIODateTimeComponent {
  build(state) {
    super.build(state);

    this.widget.on('update', () => {
      this.setPristine(false);
      this.addClass(this.getElement(), 'formio-modified');
    });
  }
}

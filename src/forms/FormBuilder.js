import FormBuilder from 'formiojs/FormBuilder';

const originCreate = FormBuilder.prototype.create;

FormBuilder.prototype.create = function() {
  console.warn('create => ', this, this.options);

  return originCreate.call(this);
};

export default FormBuilder;

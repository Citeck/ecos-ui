import baseEditForm from '../../override/base/Base.form';

// eslint-disable-next-line prettier/prettier
export default function(...extend) {
  return baseEditForm([], ...extend);
}

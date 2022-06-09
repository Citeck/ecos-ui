import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';

export const checkIsEmptyMlField = field => {
  if ((typeof field === 'string' && isEmpty(field)) || isNil(field)) {
    return true;
  }

  const keys = Object.keys(field);

  if (typeof field === 'object') {
    if (isEmpty(field)) {
      return true;
    }

    return !keys
      .map(key => {
        if (field[key] === undefined) {
          return true;
        }

        if (typeof field[key] === 'string') {
          return isEmpty(field[key]);
        }

        if (typeof field[key] === 'object') {
          return checkIsEmptyMlField(field[key]);
        }

        return false;
      })
      .includes(false);
  }

  return false;
};

import React, { forwardRef } from 'react';

import FormWrapper from './FormWrapper';

const FormWrapperWithRef = forwardRef((props, ref) => {
  return <FormWrapper {...props} forwardedRef={ref} />;
});

export default FormWrapperWithRef;

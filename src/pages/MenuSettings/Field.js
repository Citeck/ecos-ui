import React from 'react';
import classNames from 'classnames';

export function Field({ label, children, required, className, description }) {
  return (
    <div className={classNames('ecos-field-col', className)}>
      {label && <div className={classNames('ecos-field-col__title', { 'ecos-field-col__title_required': required })}>{label}</div>}
      <div>{children}</div>
      {description && <div className="ecos-field-col__description">{description}</div>}
    </div>
  );
}

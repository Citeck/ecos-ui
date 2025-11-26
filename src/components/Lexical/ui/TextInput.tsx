/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './Input.css';

import * as React from 'react';
import { JSX, HTMLInputTypeAttribute } from 'react';

import { Field, Input } from '@/components/common/form';

type Props = Readonly<{
  'data-test-id'?: string;
  label: string;
  onChange: (val: string) => void;
  placeholder?: string;
  value: string;
  type?: HTMLInputTypeAttribute;
}>;

export default function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  'data-test-id': dataTestId,
  type = 'text'
}: Props): JSX.Element {
  return (
    <Field label={label} className="citeck-lexical-editor__field">
      <Input
        type={type}
        className="Input__input"
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        data-test-id={dataTestId}
      />
    </Field>
  );
}

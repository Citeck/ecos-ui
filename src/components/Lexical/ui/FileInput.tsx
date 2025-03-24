/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './Input.css';

import * as React from 'react';
import { JSX } from 'react';

import { Field, Input } from '@/components/common/form';

type Props = Readonly<{
  'data-test-id'?: string;
  accept?: string;
  label: string;
  onChange: (files: FileList | null) => void;
}>;

export default function FileInput({ accept, label, onChange, 'data-test-id': dataTestId }: Props): JSX.Element {
  return (
    <Field label={label} className="citeck-lexical-editor__field">
      <Input
        type="file"
        accept={accept}
        className="Input__input"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.files)}
        data-test-id={dataTestId}
      />
    </Field>
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState, JSX } from 'react';
import * as React from 'react';

import EcosModal from '../../common/EcosModal';

export default function useModal(): [JSX.Element | null, (title: string, showModal: (onClose: () => void) => JSX.Element) => void] {
  const [modalContent, setModalContent] = useState<null | {
    content: JSX.Element;
    title: string;
  }>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content } = modalContent;
    return (
      <EcosModal className="ecos-modal_width-xs" isOpen hideModal={onClose} title={title} isBigHeader={false}>
        {content}
      </EcosModal>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (title: string, getContent: (onClose: () => void) => JSX.Element) => {
      setModalContent({
        content: getContent(onClose),
        title
      });
    },
    [onClose]
  );

  return [modal, showModal];
}

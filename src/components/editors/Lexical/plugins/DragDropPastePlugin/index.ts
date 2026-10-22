/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { $wrapNodeInElement, isMimeType, mediaFileReader } from '@lexical/utils';
import { $createParagraphNode, $getSelection, $insertNodes, $isRangeSelection, $isRootOrShadowRoot, COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';

import { $createFileNode } from '../../nodes/FileNode/utils';
import { $createImageNode } from '../../nodes/ImageNode';
import { $restoreRangeSelection } from '../../utils/restoreRangeSelection';

import type { FileRecord } from '../FilePlugin';

import { t } from '@/helpers/export/util';
import { NotificationManager } from '@/services/notifications';

const ACCEPTABLE_IMAGE_TYPES = ['image/', 'image/heic', 'image/heif', 'image/gif', 'image/webp'];

export type OnFilesUpload = (files: File[]) => Promise<FileRecord[] | undefined>;

type DroppedItem = { image: { file: File; src: string } } | { attachment: FileRecord };

export default function DragDropPaste({ onFilesUpload }: { onFilesUpload?: OnFilesUpload }): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files, targetEditor) => {
        if (!targetEditor.isEditable() || files.length === 0) {
          return false;
        }

        const currentSelection = $getSelection();
        const selection = $isRangeSelection(currentSelection) ? currentSelection.clone() : null;

        const attachments = files.filter(file => !isMimeType(file, ACCEPTABLE_IMAGE_TYPES));
        const uploads = Promise.resolve().then(() => {
          if (attachments.length > 0 && onFilesUpload) {
            return onFilesUpload(attachments);
          }

          return [];
        });

        let attachmentIndex = 0;
        const items: Promise<DroppedItem | null>[] = files.map(file => {
          if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
            return mediaFileReader([file], ACCEPTABLE_IMAGE_TYPES).then(([image]) => {
              if (!image) {
                return null;
              }

              return { image: { file, src: image.result } };
            });
          }

          const index = attachmentIndex++;
          return uploads.then(records => {
            const attachment = records?.[index];
            return attachment ? { attachment } : null;
          });
        });

        const reportError = () =>
          NotificationManager.error(
            t(files.length > 1 ? 'documents-widget.notification.add-many.error' : 'documents-widget.notification.add-one.error'),
            t('error')
          );

        // Resolve the whole batch before insertion so image reads and uploads cannot reorder it.
        void Promise.allSettled(items)
          .then(results => {
            if (results.some(result => result.status === 'rejected')) {
              reportError();
            }

            const ready = results.flatMap(result => (result.status === 'fulfilled' && result.value ? [result.value] : []));
            if (ready.length === 0 || !targetEditor.isEditable() || targetEditor.getRootElement() === null) {
              return;
            }

            targetEditor.update(() => {
              $restoreRangeSelection(selection);

              const nodes = ready.map(item => {
                if ('image' in item) {
                  return $createImageNode({ altText: item.image.file.name, file: item.image.file, src: item.image.src });
                }

                return $createFileNode(item.attachment);
              });

              $insertNodes(nodes);

              for (const node of nodes) {
                if ($isRootOrShadowRoot(node.getParentOrThrow())) {
                  $wrapNodeInElement(node, $createParagraphNode).selectEnd();
                }
              }
            });
          })
          .catch(reportError);

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onFilesUpload]);

  return null;
}

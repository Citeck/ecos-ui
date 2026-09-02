/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { type LexicalEditor, type NodeKey, $createTextNode, $getNodeByKey } from 'lexical';
import { useEffect } from 'react';

import { useSharedHistoryContext } from '../../context/SharedHistoryContext';
import { $isImageNode, ImageNode } from '../../nodes/ImageNode';

import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin';

export type OnImageUpload = (img: File, altText: string) => Promise<string>;

export type DragDropPasteProps = {
  onUpload?: OnImageUpload;
};

/**
 * A pasted image is inserted at once with a base64 `src` and its `File` still on the node — `__file`
 * is what `ImageNode.decorate` draws the spinner for — and the upload swaps both a moment later.
 * That swap is a side effect, not an edit the user made, so it is merged into the current history
 * entry instead of becoming one: otherwise Ctrl+Z right after a paste only rewinds the swap, leaving
 * the image in place with the spinner back on and nothing left to finish it (COREDEV-454).
 */
const AS_SIDE_EFFECT = { tag: 'history-merge' };

/**
 * Undo and redo carry the very same `File` on the node, so one upload per file serves them all and
 * Ctrl+Y never creates a second attachment. A failed upload is forgotten on purpose: the next time
 * the file turns up — an undo bringing the image back — it is tried again instead of being thrown
 * out from a cached rejection.
 */
const uploads = new WeakMap<File, Promise<string>>();

/**
 * Images already being finished off, per editor — node keys are unique to one editor only. The
 * listener below is re-registered on every render of the host component, since `onUpload` is a new
 * function each time, and meets every image again as if it had just been created; without this map
 * one upload would grow a new completion chain — a preload, an update, an error line — per render.
 */
const settlingByEditor = new WeakMap<LexicalEditor, Map<NodeKey, File>>();

const settlingOf = (editor: LexicalEditor): Map<NodeKey, File> => {
  const settling = settlingByEditor.get(editor) || new Map<NodeKey, File>();
  settlingByEditor.set(editor, settling);

  return settling;
};

const upload = (file: File, altText: string, onUpload: OnImageUpload): Promise<string> => {
  const pending = uploads.get(file);
  if (pending) {
    return pending;
  }

  const started = onUpload(file, altText);
  uploads.set(file, started);
  started.catch(() => uploads.delete(file));

  return started;
};

/** The uploaded url reaches the node only once the browser holds the image, so it never blinks. */
const preload = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error(`the uploaded image cannot be loaded: ${url}`));
    image.src = url;
  });

const sameDocument = (a: HistoryState['current'], b: HistoryState['current']): boolean =>
  !!a && !!b && JSON.stringify(a.editorState.toJSON()) === JSON.stringify(b.editorState.toJSON());

/**
 * Dropping a failed image is merged into the history entry the paste created, and when nothing else
 * happened since, that entry now reads exactly like the one below it: the first Ctrl+Z would "undo"
 * to an identical document and look broken. The empty step is folded away. When the author has typed
 * in the meantime the entries differ and nothing is folded — their Ctrl+Z then lands on the paste
 * snapshot, and the image in it is uploaded anew.
 */
const collapseNoopHistoryEntry = (editor: LexicalEditor, historyState?: HistoryState): void => {
  if (!historyState) {
    return;
  }

  const { current, undoStack } = historyState;
  const previous = undoStack[undoStack.length - 1];

  if (current?.editor === editor && previous?.editor === editor && sameDocument(current, previous)) {
    undoStack.pop();
    historyState.current = previous;
  }
};

export default function OnImageUploadPlugin({ onUpload }: DragDropPasteProps): null {
  const [editor] = useLexicalComposerContext();
  const { historyState } = useSharedHistoryContext();

  useEffect(() => {
    if (!onUpload) return;

    const settling = settlingOf(editor);

    /** Applies only if the image is still there, still with the same file; says whether it did. */
    const updateImage = (nodeKey: NodeKey, file: File, apply: (node: ImageNode) => void, discrete = false): boolean => {
      let applied = false;

      editor.update(
        () => {
          const node = $getNodeByKey<ImageNode>(nodeKey);

          // an undo may have taken the image away, or replaced its file, while the upload was in the air
          if ($isImageNode(node) && node.getFile() === file) {
            apply(node);
            applied = true;
          }
        },
        discrete ? { ...AS_SIDE_EFFECT, discrete: true } : AS_SIDE_EFFECT
      );

      return applied;
    };

    const settle = (nodeKey: NodeKey, file: File, altText: string): void => {
      if (settling.get(nodeKey) === file) return;

      settling.set(nodeKey, file);

      upload(file, altText, onUpload)
        .then(preload)
        .then(url =>
          updateImage(nodeKey, file, node => {
            node.setFile(undefined);
            node.setSrc(url);
          })
        )
        .catch((error: unknown) => {
          console.error(`The pasted image "${altText}" is dropped: its upload failed`, error);

          // discrete, so the history plugin has already seen the removal when the entry is inspected
          if (updateImage(nodeKey, file, node => node.remove(), true)) {
            collapseNoopHistoryEntry(editor, historyState);
          }
        })
        .then(() => {
          if (settling.get(nodeKey) === file) {
            settling.delete(nodeKey);
          }
        });
    };

    const unregisterMutationListener = editor.registerMutationListener(ImageNode, nodeMutations => {
      for (const [nodeKey, mutation] of nodeMutations) {
        editor.getEditorState().read(() => {
          const imageNode = $getNodeByKey<ImageNode>(nodeKey);
          if (!$isImageNode(imageNode)) return;

          const file = imageNode.getFile();
          const altText = imageNode.getAltText();

          if (file) {
            // 'updated' counts as much as 'created': an undo can land on a snapshot taken mid-upload,
            // and that image has to be finished off as well instead of spinning for ever
            settle(nodeKey, file, altText);
          } else if (mutation === 'created' && altText && imageNode.getSrc().startsWith('data:image/gif;base64,')) {
            editor.update(() => {
              const node = $getNodeByKey<ImageNode>(nodeKey);

              if ($isImageNode(node) && !node.getFile()) {
                node.replace($createTextNode(altText));
              }
            }, AS_SIDE_EFFECT);
          }
        });
      }
    });

    return () => {
      unregisterMutationListener();
    };
  }, [editor, onUpload, historyState]);

  return null;
}

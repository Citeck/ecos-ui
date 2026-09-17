/* eslint-disable header/header */
import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import ImageResizer from '../ImageResizer';

import type { LexicalEditor } from 'lexical';

// jsdom has no zoom: lexical's manual fallback multiplies `Number('')` and ends up at 0.
jest.mock('@lexical/utils', () => ({ ...jest.requireActual('@lexical/utils'), calculateZoomLevel: () => 1 }));

/**
 * A pasted picture is shown at the node's maxWidth (500px), and the resizer used to take that same
 * number as the ceiling of a drag — so in a 1000px editor the image hit an invisible wall at 500px.
 * The ceiling of a resize is the editor's content box, measured when the drag starts (COREDEV-475).
 */

const IMAGE = { width: 500, height: 145 };

function editorOf(root: HTMLElement | null): LexicalEditor {
  return { isEditable: () => true, getRootElement: () => root } as unknown as LexicalEditor;
}

/** An editor root that jsdom lays out as `clientWidth` wide with the real editor's padding. */
function editorRoot(clientWidth: number, padding = '8px 28px'): HTMLElement {
  const root = document.createElement('div');
  root.style.padding = padding;
  Object.defineProperty(root, 'clientWidth', { value: clientWidth, configurable: true });
  document.body.appendChild(root);
  return root;
}

function renderResizer(root: HTMLElement | null, natural = IMAGE) {
  const image = document.createElement('img');
  Object.defineProperty(image, 'naturalWidth', { value: natural.width });
  Object.defineProperty(image, 'naturalHeight', { value: natural.height });
  image.getBoundingClientRect = () => ({
    ...IMAGE,
    top: 0,
    left: 0,
    right: IMAGE.width,
    bottom: IMAGE.height,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });
  const onResizeEnd = jest.fn();

  const { container } = render(
    <ImageResizer
      editor={editorOf(root)}
      buttonRef={{ current: null }}
      imageRef={{ current: image }}
      onResizeStart={() => {}}
      onResizeEnd={onResizeEnd}
      setShowCaption={() => {}}
      showCaption={false}
      captionsEnabled={false}
    />
  );

  const handleOf = (direction: string) => container.querySelector(`.image-resizer-${direction}`) as HTMLElement;

  return { image, onResizeEnd, handle: handleOf('se'), handleOf };
}

/**
 * Drag the south-east handle by `dx` to the right (aspect ratio locked, like the real corner drag).
 * jsdom has no PointerEvent, so the pointer events are MouseEvents with the pointer type names —
 * both React and the document listeners of the resizer only read `clientX` / `clientY`.
 */
/** The height the resizer reported to the node on pointerup; it never writes one to the picture. */
const reportedHeight = (onResizeEnd: jest.Mock): number => onResizeEnd.mock.calls[onResizeEnd.mock.calls.length - 1][1];

const pointer = (type: string, clientX: number, clientY: number) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });

/** Press a handle at the image's bottom-right corner and move the pointer by (dx, dy). */
function drag(handle: HTMLElement, dx: number, dy: number): void {
  fireEvent(handle, pointer('pointerdown', 500, 145));
  fireEvent(document, pointer('pointermove', 500 + dx, 145 + dy));
  fireEvent(document, pointer('pointerup', 500 + dx, 145 + dy));
}

function dragSouthEast(handle: HTMLElement, dx: number): void {
  drag(handle, dx, dx / 4);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ImageResizer ceiling (COREDEV-475)', () => {
  it('lets a 500px picture grow to the full content width of a wider editor', () => {
    const { handle, image, onResizeEnd } = renderResizer(editorRoot(1000)); // content box 944px

    dragSouthEast(handle, 400);

    expect(image.style.width).toBe('900px');
    expect(onResizeEnd).toHaveBeenCalledWith(900, 900 / (IMAGE.width / IMAGE.height));
  });

  it('stops at the content box of the editor, not at its padding box', () => {
    const { handle, image } = renderResizer(editorRoot(1000)); // 1000 - 28 - 28

    dragSouthEast(handle, 2000);

    expect(image.style.width).toBe('944px');
  });

  it('measures the editor when the drag starts, so a resized layout is respected', () => {
    const root = editorRoot(1000);
    const { handle, image } = renderResizer(root);

    Object.defineProperty(root, 'clientWidth', { value: 600, configurable: true });
    dragSouthEast(handle, 2000);

    expect(image.style.width).toBe('544px');
  });

  it('never shrinks below the minimum width', () => {
    const { handle, image } = renderResizer(editorRoot(1000));

    dragSouthEast(handle, -2000);

    expect(image.style.width).toBe('100px');
  });
});

/**
 * The edge handles used to stretch one dimension only, distorting the picture; nothing could put
 * the proportions back afterwards. Every handle now scales the picture proportionally, and the
 * proportion is the picture's natural one, so a picture distorted earlier is straightened by the
 * next resize.
 */
describe('ImageResizer keeps the aspect ratio (COREDEV-475)', () => {
  const RATIO = IMAGE.width / IMAGE.height;

  it('scales the height along when the east handle changes the width', () => {
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000));

    drag(handleOf('e'), 100, 0);

    expect(image.style.width).toBe('600px');
    expect(image.style.height).toBe('');
    expect(onResizeEnd).toHaveBeenCalledWith(600, 600 / RATIO);
  });

  it('scales the width along when the south handle changes the height', () => {
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000));

    drag(handleOf('s'), 0, 29);

    expect(reportedHeight(onResizeEnd)).toBeCloseTo(174, 0);
    expect(parseFloat(image.style.width)).toBeCloseTo(174 * RATIO, 0);
  });

  it('caps a vertical drag by the editor width as well', () => {
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000)); // content box 944px

    drag(handleOf('s'), 0, 2000);

    expect(image.style.width).toBe('944px');
    expect(reportedHeight(onResizeEnd)).toBeCloseTo(944 / RATIO, 3);
  });

  it('shrinks proportionally from the west handle', () => {
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000));

    drag(handleOf('w'), 100, 0); // moving the left edge right makes the picture narrower

    expect(image.style.width).toBe('400px');
    expect(reportedHeight(onResizeEnd)).toBeCloseTo(400 / RATIO, 3);
  });

  it('straightens a picture that was distorted before, using its natural proportions', () => {
    // box 500x145 but the picture is really 4:3
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000), { width: 800, height: 600 });

    drag(handleOf('e'), 100, 0);

    expect(image.style.width).toBe('600px');
    expect(reportedHeight(onResizeEnd)).toBeCloseTo(450, 3);
  });

  it('falls back to the box proportions while the picture has no natural size yet', () => {
    const { handleOf, image, onResizeEnd } = renderResizer(editorRoot(1000), { width: 0, height: 0 });

    drag(handleOf('e'), 100, 0);

    expect(image.style.width).toBe('600px');
    expect(reportedHeight(onResizeEnd)).toBeCloseTo(600 / RATIO, 3);
  });
});

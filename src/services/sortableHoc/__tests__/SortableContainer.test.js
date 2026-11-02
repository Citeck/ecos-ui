import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import sortableContainer from '../SortableContainer';
import sortableElement from '../SortableElement';

const Item = sortableElement(({ label }) => <div>{label}</div>);
const List = sortableContainer(() => (
  <div>
    <Item index={0} label="First tab" />
    <Item index={1} label="Second tab" />
  </div>
));

describe('SortableContainer drag end cleanup', () => {
  it.each(['mouse', 'touch', 'touch cancel'])('releases %s listeners so later drags are independent', async input => {
    const onSortEnd = jest.fn();
    const errors = jest.fn(event => event.preventDefault());
    window.addEventListener('error', errors);
    const view = render(<List axis="x" onSortEnd={onSortEnd} />);

    try {
      // Container event listeners are installed in a promise callback on mount.
      await act(async () => {});
      const tab = screen.getByText('First tab');
      const start = () => {
        if (input !== 'mouse') {
          fireEvent.touchStart(tab, { touches: [{ pageX: 10, pageY: 10 }] });
        } else {
          fireEvent.mouseDown(tab, { button: 0, clientX: 10, clientY: 10 });
        }
      };
      const end = () => {
        if (input === 'touch cancel') {
          fireEvent.touchCancel(tab);
        } else if (input === 'touch') {
          fireEvent.touchEnd(tab, { changedTouches: [{ pageX: 50, pageY: 10 }] });
        } else {
          fireEvent.mouseUp(tab, { clientX: 50, clientY: 10 });
        }
      };

      for (let drag = 0; drag < 2; drag++) {
        start();
        end();
        expect(onSortEnd).toHaveBeenCalledTimes(drag + 1);

        // A later release from another DnD system must not finish the old sort.
        end();
        expect(errors).not.toHaveBeenCalled();
        expect(onSortEnd).toHaveBeenCalledTimes(drag + 1);
      }

      view.unmount();
      end();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      // Always release the view and the error observer, including on failure.
      view.unmount();
      window.removeEventListener('error', errors);
    }
  });
});

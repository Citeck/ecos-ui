import ColorContextPadProvider from 'bpmn-js-color-picker/colors/ColorContextPadProvider';

const colorImageSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path d="m12.5 5.5.3-.4 3.6-3.6c.5-.5 1.3-.5 1.7 0l1 1c.5.4.5 1.2 0 1.7l-3.6 3.6-.4.2v.2c0 1.4.6 2 1 2.7v.6l-1.7 1.6c-.2.2-.4.2-.6 0L7.3 6.6a.4.4 0 0 1 0-.6l.3-.3.5-.5.8-.8c.2-.2.4-.1.6 0 .9.5 1.5 1.1 3 1.1zm-9.9 6 4.2-4.2 6.3 6.3-4.2 4.2c-.3.3-.9.3-1.2 0l-.8-.8-.9-.8-2.3-2.9" /></svg>';

const colorImageUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(colorImageSvg);

ColorContextPadProvider.prototype._createPopupAction = function (elements) {
  const translate = this._translate;
  const contextPad = this._contextPad;
  const popupMenu = this._popupMenu;

  return {
    'set-color': {
      group: 'edit',
      className: 'bpmn-icon-color',
      title: translate('Set Color'),
      imageUrl: colorImageUrl,
      action: {
        click: event => {
          // get start popup draw start position
          const position = {
            ...getStartPosition(contextPad, elements),
            cursor: {
              x: event.x,
              y: event.y
            }
          };

          // open new color-picker popup
          popupMenu.open(elements, 'color-picker', position);
        }
      }
    }
  };
};

const getStartPosition = (contextPad, elements) => {
  const pad = contextPad.getPad(elements).html;

  const padRect = pad.getBoundingClientRect();

  const top = padRect.top;
  const left = padRect.left;

  const pos = {
    x: left,
    y: top + padRect.height
  };

  return pos;
};

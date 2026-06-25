import { ACTIVE_LINE_CLASS, createLineRevealer } from '../monacoLineReveal';

// Минимальный мок monaco-editor instance + global API (Range), достаточный для проверки реврала.
function makeMocks() {
  let decoCounter = 0;
  const editor = {
    revealLineInCenter: jest.fn(),
    // deltaDecorations(prev, next): затирает prev, возвращает новые id'ы (по одному на дескриптор).
    deltaDecorations: jest.fn((prev, next) => next.map(() => `dec-${decoCounter++}`))
  };
  const monacoApi = {
    Range: jest.fn(function Range(startLine, startCol, endLine, endCol) {
      this.startLine = startLine;
      this.startCol = startCol;
      this.endLine = endLine;
      this.endCol = endCol;
    })
  };
  return { editor, monacoApi };
}

describe('createLineRevealer — Monaco scroll/highlight (Task CTS-4)', () => {
  test('reveal scrolls to the line and sets a whole-line decoration', () => {
    const { editor, monacoApi } = makeMocks();
    const revealer = createLineRevealer();
    revealer.attach(editor, monacoApi);

    revealer.reveal(7);

    expect(editor.revealLineInCenter).toHaveBeenCalledWith(7);
    expect(monacoApi.Range).toHaveBeenCalledWith(7, 1, 7, 1);
    // deltaDecorations(prev=[], next=[descriptor]) — первый реврал, прошлых декораций нет.
    expect(editor.deltaDecorations).toHaveBeenCalledTimes(1);
    const [prev, next] = editor.deltaDecorations.mock.calls[0];
    expect(prev).toEqual([]);
    expect(next).toHaveLength(1);
    expect(next[0].options).toMatchObject({ isWholeLine: true, className: ACTIVE_LINE_CLASS });
  });

  test('a second reveal resets the previous decoration (passes prior ids to deltaDecorations)', () => {
    const { editor, monacoApi } = makeMocks();
    const revealer = createLineRevealer();
    revealer.attach(editor, monacoApi);

    revealer.reveal(3);
    const firstResult = editor.deltaDecorations.mock.results[0].value; // ['dec-0']

    revealer.reveal(10);

    expect(editor.revealLineInCenter).toHaveBeenLastCalledWith(10);
    // Второй вызов передаёт id'ы прошлой декорации первым аргументом — Monaco их затирает.
    const [prevOnSecond] = editor.deltaDecorations.mock.calls[1];
    expect(prevOnSecond).toEqual(firstResult);
  });

  test('clear removes the active decoration', () => {
    const { editor, monacoApi } = makeMocks();
    const revealer = createLineRevealer();
    revealer.attach(editor, monacoApi);

    revealer.reveal(5);
    const decoIds = editor.deltaDecorations.mock.results[0].value;
    editor.deltaDecorations.mockClear();

    revealer.clear();

    // clear затирает текущие декорации пустым списком.
    expect(editor.deltaDecorations).toHaveBeenCalledWith(decoIds, []);
  });

  test('reveal is a no-op before attach (no editor) and for invalid lines', () => {
    const { editor, monacoApi } = makeMocks();
    const revealer = createLineRevealer();

    // До attach — нет editor/monaco, ничего не делаем (не должно бросать).
    expect(() => revealer.reveal(4)).not.toThrow();
    expect(editor.revealLineInCenter).not.toHaveBeenCalled();

    revealer.attach(editor, monacoApi);

    // Невалидные строки игнорируются.
    revealer.reveal(0);
    revealer.reveal(-2);
    revealer.reveal(undefined);
    revealer.reveal(NaN);
    expect(editor.revealLineInCenter).not.toHaveBeenCalled();
    expect(editor.deltaDecorations).not.toHaveBeenCalled();
  });
});

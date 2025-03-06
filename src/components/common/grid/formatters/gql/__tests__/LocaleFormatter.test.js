import React from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { render, screen, waitFor } from '@testing-library/react';

import formatterStore from '../../formatterStore';
import '../__mocks__/LocaleFormatter.mock';

const { LocaleFormatter } = formatterStore;

describe('LocaleFormatter React Component', () => {
  const defaultProps = {
    params: {
      prefix: '',
      postfix: '',
    },
    rowIndex: 0,
    cell: '',
  };
  const data = [
    {
      title: 'Empty input data without prefix and postfix',
      input: {},
      output: '',
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: answer',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.',
        },
        cell: 'answer',
      },
      output: 'Вернуть на нормоконтроль',
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: cancel',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.',
        },
        cell: 'cancel',
      },
      output: 'Отменить нормоконтроль',
    },
    {
      title: 'Use prefix: listconstraint.wfnc_correctOutcomeOptions, value: exit',
      input: {
        ...defaultProps,
        params: {
          prefix: 'listconstraint.wfnc_correctOutcomeOptions.',
        },
        cell: 'exit',
      },
      output: 'Завершить задачу',
    },
  ];

  data.forEach((item) => {
    it(item.title, async () => {
      const { container } = render(<LocaleFormatter {...item.input} />);

      if (item.output) {
        await waitFor(() => expect(screen.getByText(item.output)).toBeInTheDocument());
      } else {
        expect(container.textContent).toBe(item.output);
      }
    });
  });
});

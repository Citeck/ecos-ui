import React from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { render } from '@testing-library/react';

import Grid from '../Grid';

describe('Grid', () => {
  describe('Check noHorizontalScroll props', () => {
    const defaultProps = {
      columns: JSON.parse(
        `[{"default":"true","type":"text","text":"Город пребывания","multiple":"false","attribute":"term:teraCity","formatter":{"name":"FormFieldFormatter","params":{"scope":null,"attribute":"term:teraCity","component":{"defaultValue":null,"type":"selectJournal","ecos":{"dataType":"json-record"},"input":"true","computed":{"valueDisplayName":"var a = ['country', 'state', 'name'];\\\\r\\\\ndisp = _.join(a.map(function(v) { \\\\r\\\\n  return value.att(v); \\\\r\\\\n}), ' ');"},"journalId":"cities-rs","key":"term_teraCity","validate":{"required":true},"label":"term:teraCity","presetFilterPredicatesJs":null,"properties":{"attribute":"term:teraCity"}},"schema":".att(n:\\"term:teraCity\\"){assoc}","edgeSchema":".edge(n:\\"term:teraCity\\"){protected,title}","dataType":"json-record"}},"name":"term:teraCity","label":"Город пребывания","params":{},"hidden":"false","visible":"true","editable":"false","sortable":"true","groupable":"true","searchable":"true","attSchema":"term:teraCity?disp","dataField":"term:teraCity","formatExtraData":{"params":{"scope":null,"attribute":"term:teraCity","component":{"defaultValue":null,"type":"selectJournal","ecos":{"dataType":"json-record"},"input":"true","computed":{"valueDisplayName":"var a = ['country', 'state', 'name'];\\\\r\\\\ndisp = _.join(a.map(function(v) { \\\\r\\\\n  return value.att(v); \\\\r\\\\n}), ' ');"},"journalId":"cities-rs","key":"term_teraCity","validate":{"required":"true"},"label":"term:teraCity","presetFilterPredicatesJs":null,"properties":{"attribute":"term:teraCity"}},"schema":".att(n:\\"term:teraCity\\"){assoc}","edgeSchema":".edge(n:\\"term:teraCity\\"){protected,title}","dataType":"json-record"}}},{"default":"true","type":"date","text":"Дата заселения","multiple":"false","attribute":"term:teraCheckInDate","name":"term:teraCheckInDate","label":"Дата заселения","params":{},"hidden":"false","visible":"true","editable":"false","sortable":"true","groupable":"true","searchable":"true","attSchema":"term:teraCheckInDate?disp","dataField":"term:teraCheckInDate","formatExtraData":{"params":{}}}]`,
      ),
      data: JSON.parse(
        `[{"default":"true","type":"text","text":"Город пребывания","multiple":"false","attribute":"term:teraCity","formatter":{"name":"FormFieldFormatter","params":{"scope":null,"attribute":"term:teraCity","component":{"defaultValue":null,"type":"selectJournal","ecos":{"dataType":"json-record"},"input":"true","computed":{"valueDisplayName":"var a = ['country', 'state', 'name'];\\\\r\\\\ndisp = _.join(a.map(function(v) { \\\\r\\\\n  return value.att(v); \\\\r\\\\n}), ' ');"},"journalId":"cities-rs","key":"term_teraCity","validate":{"required":"true"},"label":"term:teraCity","presetFilterPredicatesJs":null,"properties":{"attribute":"term:teraCity"}},"schema":".att(n:\\"term:teraCity\\"){assoc}","edgeSchema":".edge(n:\\"term:teraCity\\"){protected,title}","dataType":"json-record"}},"name":"term:teraCity","label":"Город пребывания","params":{},"hidden":"false","visible":"true","editable":"false","sortable":"true","groupable":"true","searchable":"true","attSchema":"term:teraCity?disp","dataField":"term:teraCity","formatExtraData":{"params":{"scope":null,"attribute":"term:teraCity","component":{"defaultValue":null,"type":"selectJournal","ecos":{"dataType":"json-record"},"input":"true","computed":{"valueDisplayName":"var a = ['country', 'state', 'name'];\\\\r\\\\ndisp = _.join(a.map(function(v) { \\\\r\\\\n  return value.att(v); \\\\r\\\\n}), ' ');"},"journalId":"cities-rs","key":"term_teraCity","validate":{"required":"true"},"label":"term:teraCity","presetFilterPredicatesJs":null,"properties":{"attribute":"term:teraCity"}},"schema":".att(n:\\"term:teraCity\\"){assoc}","edgeSchema":".edge(n:\\"term:teraCity\\"){protected,title}","dataType":"json-record"}}},{"default":"true","type":"date","text":"Дата заселения","multiple":"false","attribute":"term:teraCheckInDate","name":"term:teraCheckInDate","label":"Дата заселения","params":{},"hidden":"false","visible":"true","editable":"false","sortable":"true","groupable":"true","searchable":"true","attSchema":"term:teraCheckInDate?disp","dataField":"term:teraCheckInDate","formatExtraData":{"params":{}}}]`,
      ),
    };
    const data = [
      {
        title: 'Default params - noHorizontalScroll disabled',
        input: {},
        output: [
          {
            query: 'ecos-grid_no-scroll_h',
            result: 0,
          },
          {
            query: 'ecos-grid',
            result: 1,
          },
        ],
      },
      {
        title: 'Set noHorizontalScroll to true',
        input: { noHorizontalScroll: true },
        output: [
          {
            query: 'ecos-grid_no-scroll_h',
            result: 1,
          },
          {
            query: 'ecos-grid',
            result: 1,
          },
        ],
      },
      {
        title: 'Set noHorizontalScroll to false',
        input: { noHorizontalScroll: false },
        output: [
          {
            query: 'ecos-grid_no-scroll_h',
            result: 0,
          },
          {
            query: 'ecos-grid',
            result: 1,
          },
        ],
      },
    ];

    data.forEach((item) => {
      it(item.title, () => {
        const wrapper = render(<Grid {...defaultProps} />);

        return Promise.resolve(wrapper)
          .then(() => {
            const newProps = {
              ...defaultProps,
              ...item.input,
            };

            wrapper.rerender(<Grid {...newProps} />);
          })
          .then(() => {
            item.output.forEach((output) => {
              const element = wrapper.container.getElementsByClassName(output.query);

              expect(element.length).toBe(output.result);
            });
          })
          .then(() => wrapper.unmount());
      });
    });
  });
});

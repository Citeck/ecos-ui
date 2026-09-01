import { render } from '@testing-library/react';
import React from 'react';

import ExecuteInfoAction from '../ExecuteInfoAction';
import { ResultTypes } from '../../util/constants';

let mockGridProps;

jest.mock('@/components/common', () => ({
  Loader: () => null
}));

jest.mock('@/components/common/grid', () => ({
  Grid: props => {
    mockGridProps = props;

    return null;
  }
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

describe('ExecuteInfoAction download link', () => {
  const renderLink = url => {
    mockGridProps = undefined;

    render(<ExecuteInfoAction type={ResultTypes.LINK} data={{ url }} />);

    const column = mockGridProps.columns.find(item => item.dataField === 'link');
    const Formatter = column.formatExtraData.formatter;
    const { container } = render(<Formatter cell={mockGridProps.data[0].link} />);

    return container.querySelector('a');
  };

  it('asks the ecos content endpoint for an attachment', () => {
    const link = renderLink('/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report');

    expect(link.getAttribute('href')).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report&download=true');
    expect(link.hasAttribute('download')).toEqual(true);
  });

  it('overrides the inline disposition of an ecos content url', () => {
    const link = renderLink('/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report&download=false');

    expect(link.getAttribute('href')).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report&download=true');
    expect(link.getAttribute('href').match(/download=/g)).toHaveLength(1);
  });

  it('keeps the signed query string of a link of another endpoint', () => {
    const url = 'https://s3.example.com/reports/report.xlsx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123';
    const link = renderLink(url);

    expect(link.getAttribute('href')).toEqual(url);
    expect(link.getAttribute('href')).not.toContain('download=');
  });

  it('proxies an alfresco node link and leaves its own disposition convention alone', () => {
    const link = renderLink('citeck/node/workspace://SpacesStore/1234/content?a=true');

    expect(link.getAttribute('href')).toEqual('/gateway/alfresco/alfresco/s/citeck/node/workspace://SpacesStore/1234/content?a=true');
    expect(link.getAttribute('href')).not.toContain('download=');
  });

  it('renders a url with a quote as text instead of letting it out of the attribute', () => {
    const link = renderLink('https://s3.example.com/r.xlsx?a="><img src=x onerror=alert(1)>');

    expect(link.getAttribute('href')).toEqual('https://s3.example.com/r.xlsx?a="><img src=x onerror=alert(1)>');
    expect(link.querySelector('img')).toBeNull();
  });
});

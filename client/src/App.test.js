import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders Hello PrizmDoc Viewer', () => {
  const { getByText } = render(<App />);
  const element = getByText(/hello prizmdoc viewer/i);
  expect(element).toBeInTheDocument();
});

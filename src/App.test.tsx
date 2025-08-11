import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders shelter management system', () => {
  render(<App />);
  const headerElement = screen.getByRole('heading', { name: /shelter management system/i });
  expect(headerElement).toBeInTheDocument();
});

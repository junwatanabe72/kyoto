import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading state', () => {
  render(<App />);
  const loading = screen.getByText(/Loading/i);
  expect(loading).toBeInTheDocument();
});

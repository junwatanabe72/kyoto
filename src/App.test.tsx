import { render, screen } from '@testing-library/react';
import App from './App';

test('shows loading message', () => {
  render(<App />);
  const loading = screen.getByText('地図を読み込み中...');
  expect(loading).toBeInTheDocument();
});


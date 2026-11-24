import { render, screen } from '@testing-library/react';

import HomePage from './page';

describe('HomePage (scaffold)', () => {
  it('renders the shop name in Arabic', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'لابورتا كيك' })).toBeInTheDocument();
  });
});

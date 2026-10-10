import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '../../apps/web/src/app/page';

describe('temporary public shell', () => {
  it('renders minimal Packet 01 copy', async () => {
    const jsx = await HomePage();
    render(jsx);
    expect(screen.getByText('ZAVLIO')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Build what's next." })).toBeInTheDocument();
  });
});

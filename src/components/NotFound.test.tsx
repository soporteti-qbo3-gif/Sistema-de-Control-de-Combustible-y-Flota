import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NotFound } from './NotFound';

describe('NotFound Component', () => {
  it('renders correctly and contains 404', () => {
    render(<NotFound />);
    const notFoundElement = screen.getByText(/404/);
    expect(notFoundElement).toBeDefined();
    expect(notFoundElement.textContent).toContain('404');
  });
});

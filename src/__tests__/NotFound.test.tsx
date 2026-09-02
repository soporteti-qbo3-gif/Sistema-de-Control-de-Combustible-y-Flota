import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NotFound } from '../pages/NotFound';

describe('NotFound Page Component', () => {
  it('renders 404 error message correctly', () => {
    render(<NotFound />);
    expect(screen.getByText(/Error 404/i)).toBeDefined();
    expect(screen.getByText(/Página no encontrada/i)).toBeDefined();
  });
});

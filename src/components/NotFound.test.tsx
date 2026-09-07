import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NotFound } from './NotFound';

describe('NotFound Component', () => {
  it('renders correctly and contains 404 or No encontrado', () => {
    render(<NotFound />);
    const notFoundElement = screen.getByText(/404/);
    const textElement = screen.getByText(/Página no encontrada/i);
    expect(notFoundElement).toBeDefined();
    expect(notFoundElement.textContent).toContain('404');
    expect(textElement).toBeDefined();
  });
});

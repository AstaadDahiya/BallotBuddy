import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccessibilityControls from './AccessibilityControls';

const defaultProps = {
  fontSize: 'normal',
  onFontSizeChange: vi.fn(),
  language: 'English',
  onLanguageChange: vi.fn(),
};

describe('AccessibilityControls', () => {
  it('renders Text Size label', () => {
    render(<AccessibilityControls {...defaultProps} />);
    expect(screen.getByText('Text Size')).toBeInTheDocument();
  });

  it('renders Language label', () => {
    render(<AccessibilityControls {...defaultProps} />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('renders font size radio buttons', () => {
    render(<AccessibilityControls {...defaultProps} />);
    expect(screen.getByRole('radio', { name: /Normal text size/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Large text size/ })).toBeInTheDocument();
  });

  it('marks normal as checked when fontSize is normal', () => {
    render(<AccessibilityControls {...defaultProps} fontSize="normal" />);
    expect(screen.getByRole('radio', { name: /Normal text size/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Large text size/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('marks large as checked when fontSize is large', () => {
    render(<AccessibilityControls {...defaultProps} fontSize="large" />);
    expect(screen.getByRole('radio', { name: /Large text size/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Normal text size/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onFontSizeChange when clicking normal', () => {
    const fn = vi.fn();
    render(<AccessibilityControls {...defaultProps} fontSize="large" onFontSizeChange={fn} />);
    fireEvent.click(screen.getByRole('radio', { name: /Normal text size/ }));
    expect(fn).toHaveBeenCalledWith('normal');
  });

  it('calls onFontSizeChange when clicking large', () => {
    const fn = vi.fn();
    render(<AccessibilityControls {...defaultProps} fontSize="normal" onFontSizeChange={fn} />);
    fireEvent.click(screen.getByRole('radio', { name: /Large text size/ }));
    expect(fn).toHaveBeenCalledWith('large');
  });

  it('renders language dropdown with options', () => {
    render(<AccessibilityControls {...defaultProps} />);
    const select = screen.getByLabelText(/Select response language/i);
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBeGreaterThanOrEqual(10);
  });

  it('calls onLanguageChange on selection', () => {
    const fn = vi.fn();
    render(<AccessibilityControls {...defaultProps} onLanguageChange={fn} />);
    fireEvent.change(screen.getByLabelText(/Select response language/i), { target: { value: 'Hindi' } });
    expect(fn).toHaveBeenCalledWith('Hindi');
  });

  it('has a radiogroup role', () => {
    render(<AccessibilityControls {...defaultProps} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

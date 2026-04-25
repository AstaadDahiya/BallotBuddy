import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PollingStationFinder from './PollingStationFinder';

describe('PollingStationFinder', () => {
  it('renders the input field', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    expect(screen.getByLabelText(/Enter your PIN code/i)).toBeInTheDocument();
  });

  it('renders the search button', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    expect(screen.getByRole('button', { name: /Search for polling stations/i })).toBeInTheDocument();
  });

  it('disables search button when input is empty', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    expect(screen.getByRole('button', { name: /Search for polling stations/i })).toBeDisabled();
  });

  it('enables search button when input has value', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    fireEvent.change(screen.getByLabelText(/Enter your PIN code/i), { target: { value: '110001' } });
    expect(screen.getByRole('button', { name: /Search for polling stations/i })).not.toBeDisabled();
  });

  it('shows map iframe after search', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    fireEvent.change(screen.getByLabelText(/Enter your PIN code/i), { target: { value: '110001' } });
    fireEvent.click(screen.getByRole('button', { name: /Search for polling stations/i }));
    const iframe = screen.getByTitle(/Map showing polling stations near 110001/i);
    expect(iframe).toBeInTheDocument();
  });

  it('generates correct Google Maps URL', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    fireEvent.change(screen.getByLabelText(/Enter your PIN code/i), { target: { value: '560001' } });
    fireEvent.click(screen.getByRole('button', { name: /Search for polling stations/i }));
    const iframe = screen.getByTitle(/Map showing polling stations near 560001/i);
    expect(iframe.getAttribute('src')).toContain('google.com/maps/embed');
    expect(iframe.getAttribute('src')).toContain('test-key');
    expect(iframe.getAttribute('src')).toContain('560001');
  });

  it('does not show iframe before search', () => {
    const { container } = render(<PollingStationFinder googleMapsApiKey="test-key" />);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('has correct input id', () => {
    render(<PollingStationFinder googleMapsApiKey="test-key" />);
    expect(document.getElementById('polling-pincode-input')).toBeInTheDocument();
  });
});

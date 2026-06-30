import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import HelpScreen from '../../components/HelpScreen';
import { helpSections } from '../../constants/helpInfo';

describe('HelpScreen', () => {
  it('renders help sections and closes on request', () => {
    const onClose = jest.fn();

    render(<HelpScreen visible onClose={onClose} />);

    expect(screen.getByText('Aide')).toBeTruthy();
    expect(screen.getByText(/Toutes les données restent sur votre appareil/)).toBeTruthy();

    for (const section of helpSections) {
      expect(screen.getByText(section.title)).toBeTruthy();
    }

    fireEvent.press(screen.getByLabelText("Fermer l'aide"));
    expect(onClose).toHaveBeenCalled();
  });
});

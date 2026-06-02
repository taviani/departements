import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { departements } from '../data/departements';

jest.mock('../components/FranceMap', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');

  return React.forwardRef(({ selectedCode, onDepartmentPress, onZoomChange }, ref) => {
    React.useImperativeHandle(ref, () => ({
      zoomToDepartment: jest.fn(() => {
        onZoomChange?.(true);
        return true;
      }),
      resetZoom: jest.fn(() => {
        onZoomChange?.(false);
      }),
    }));

    return (
      <View testID="france-map">
        <TouchableOpacity
          testID="map-select-paris"
          onPress={() => onDepartmentPress('75')}
        >
          <Text>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="map-zoom-out"
          onPress={() => onZoomChange(false)}
        >
          <Text>Zoom out</Text>
        </TouchableOpacity>
        <Text testID="map-selected">{selectedCode ?? 'none'}</Text>
      </View>
    );
  });
});

describe('App QA', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the main title and detail strip', () => {
    render(<App />);

    expect(screen.getByText('Départements de France')).toBeTruthy();
    expect(screen.getByText(departements[0].name)).toBeTruthy();
    expect(screen.getByText(departements[0].region)).toBeTruthy();
  });

  it('shows the full list when the list button is pressed', () => {
    render(<App />);

    fireEvent.press(
      screen.getByLabelText('Afficher la liste')
    );

    expect(screen.getByText('96 départements')).toBeTruthy();
    expect(screen.getAllByText('Ain').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Aisne')).toBeTruthy();
  });

  it('filters the list by department name without searching regions', () => {
    render(<App />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...'),
      'Paris'
    );

    expect(screen.getByText('Paris')).toBeTruthy();
    expect(screen.queryByText('Bretagne')).toBeNull();
    expect(screen.getByText('1 département')).toBeTruthy();
  });

  it('does not match region names in search', () => {
    render(<App />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...'),
      'Normandie'
    );

    expect(screen.getByText('0 département')).toBeTruthy();
  });

  it('selects a department from the map', () => {
    render(<App />);

    fireEvent.press(screen.getByTestId('map-select-paris'));

    expect(screen.getByText('Paris')).toBeTruthy();
    expect(screen.getByTestId('map-selected').props.children).toBe('75');
  });

  it('clears selection and resets zoom when closing the detail strip', () => {
    render(<App />);

    fireEvent.press(screen.getByTestId('map-select-paris'));
    expect(screen.getByText('Paris')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Fermer les détails'));

    expect(screen.queryByText('Zoomer sur Paris')).toBeNull();
  });

  it('toggles zoom from the detail strip', () => {
    render(<App />);

    fireEvent.press(
      screen.getByLabelText(`Zoomer sur ${departements[0].name}`)
    );

    expect(screen.getByLabelText(`Dézoomer ${departements[0].name}`)).toBeTruthy();
  });

  it('picks a different department when shuffle is pressed', () => {
    render(<App />);

    const initialName = departements[0].name;
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    fireEvent.press(
      screen.getByLabelText('Afficher un département au hasard')
    );

    const nextIndex = Math.floor(0.5 * departements.length);
    expect(screen.getByText(departements[nextIndex].name)).toBeTruthy();
    expect(departements[nextIndex].name).not.toBe(initialName);
  });

  it('updates zoom state when the map reports zoom changes', () => {
    render(<App />);

    fireEvent.press(screen.getByTestId('map-zoom-out'));

    expect(
      screen.getByLabelText(`Zoomer sur ${departements[0].name}`)
    ).toBeTruthy();
  });
});

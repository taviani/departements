import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { departements } from '../data/departements';
import { getPrefectureName } from '../data/prefectures.js';

let swipeLeftHandler;
let swipeRightHandler;
jest.mock('../hooks/useHorizontalSwipe', () => ({
  useHorizontalSwipe: ({ onSwipeLeft, onSwipeRight }) => {
    swipeLeftHandler = onSwipeLeft;
    swipeRightHandler = onSwipeRight;
    return {};
  },
}));

jest.mock('../components/FranceMap', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');

  return ({ selectedCode, detailCode, onDepartmentPress }) => (
    <View testID="france-map">
      <TouchableOpacity
        testID="map-select-paris"
        onPress={() => onDepartmentPress('75')}
      >
        <Text>Map</Text>
      </TouchableOpacity>
      <Text testID="map-selected">{selectedCode ?? 'none'}</Text>
      <Text testID="map-detail">{detailCode ?? 'none'}</Text>
    </View>
  );
});

const openSearchOverlay = () => {
  act(() => {
    swipeRightHandler();
  });
};

describe('App QA', () => {
  beforeEach(() => {
    swipeLeftHandler = undefined;
    swipeRightHandler = undefined;
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the main title and detail strip', () => {
    render(<App />);

    expect(screen.getByText('Départements')).toBeTruthy();
    expect(screen.getByText(departements[0].name)).toBeTruthy();
    expect(
      screen.getByText(`Préfecture : ${getPrefectureName(departements[0].number)}`)
    ).toBeTruthy();
    expect(
      screen.queryByPlaceholderText('Rechercher par numéro ou nom...')
    ).toBeNull();
  });

  it('opens search in an overlay when swiping right', () => {
    render(<App />);

    openSearchOverlay();

    expect(screen.getByText('Rechercher')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...')
    ).toBeTruthy();
  });

  it('opens search from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Rechercher'));

    expect(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...')
    ).toBeTruthy();
  });

  it('opens legal information from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Informations légales'));

    expect(screen.getByText('Politique de confidentialité')).toBeTruthy();
    expect(screen.getByText('Conditions d\'utilisation')).toBeTruthy();
    expect(screen.getByText(/ne collecte, ne stocke et ne transmet aucune donnée personnelle/)).toBeTruthy();
  });

  it('opens notification settings from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Notifications'));

    expect(screen.getByText('Autorisation système')).toBeTruthy();
    expect(screen.getByLabelText('Activer les notifications')).toBeTruthy();
    expect(screen.getByLabelText('Département du jour')).toBeTruthy();
  });

  it('shows the full list from the search overlay', () => {
    render(<App />);

    openSearchOverlay();
    fireEvent.press(screen.getByLabelText('Afficher la liste'));

    expect(screen.getByText('96 départements')).toBeTruthy();
    expect(screen.getAllByText('Ain').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Aisne')).toBeTruthy();
  });

  it('filters the list by department name without searching regions', () => {
    render(<App />);

    openSearchOverlay();
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

    openSearchOverlay();
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

  it('clears selection when closing the detail strip', () => {
    render(<App />);

    fireEvent.press(screen.getByTestId('map-select-paris'));
    expect(screen.getByText('Paris')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Fermer les détails'));

    expect(screen.queryByText('Zoomer sur Paris')).toBeNull();
  });

  it('clears search when closing the detail strip', () => {
    render(<App />);

    openSearchOverlay();
    fireEvent.changeText(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...'),
      'Paris'
    );
    fireEvent.press(screen.getByText('Paris'));
    fireEvent.press(screen.getByLabelText('Fermer les détails'));

    openSearchOverlay();
    expect(screen.getByPlaceholderText('Rechercher par numéro ou nom...').props.value).toBe('');
  });

  it('opens the department detail map from the detail strip', () => {
    render(<App />);

    fireEvent.press(
      screen.getByLabelText(`Zoomer sur ${departements[0].name}`)
    );

    expect(screen.getByLabelText(`Dézoomer ${departements[0].name}`)).toBeTruthy();
    expect(screen.getByTestId('map-detail').props.children).toBe(departements[0].number);
  });

  it('picks a different department when swiping left on the map', () => {
    render(<App />);

    const initialName = departements[0].name;
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    act(() => {
      swipeLeftHandler();
    });

    const nextIndex = Math.floor(0.5 * departements.length);
    expect(screen.getByText(departements[nextIndex].name)).toBeTruthy();
    expect(departements[nextIndex].name).not.toBe(initialName);
  });
});

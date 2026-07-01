import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { departements } from '../data/departements';
import { getPrefectureName } from '../data/prefectures.js';

let swipeLeftHandler;
let swipeRightHandler;
let swipeDownHandler;
let mockLocationState = {
  currentDepartementCode: null,
  locationPermission: 'undetermined',
  matchCelebration: null,
};

const mockCelebrateMatch = jest.fn((code) => {
  const departement = departements.find((item) => item.number === code);
  if (!departement) {
    return;
  }
  mockLocationState.matchCelebration = {
    number: departement.number,
    name: departement.name,
  };
});

const mockClearMatchCelebration = jest.fn(() => {
  mockLocationState.matchCelebration = null;
});

jest.mock('../hooks/useHorizontalSwipe', () => ({
  useHorizontalSwipe: ({ onSwipeLeft, onSwipeRight, onSwipeDown }) => {
    swipeLeftHandler = onSwipeLeft;
    swipeRightHandler = onSwipeRight;
    swipeDownHandler = onSwipeDown;
    return {};
  },
}));

jest.mock('../components/AnimatedSplash', () => {
  const React = require('react');

  return ({ onFinish }) => {
    React.useEffect(() => {
      onFinish?.();
    }, [onFinish]);

    return null;
  };
});

jest.mock('../hooks/useDepartementLocation', () => ({
  useDepartementLocation: () => ({
    currentDepartementCode: mockLocationState.currentDepartementCode,
    locationPermission: mockLocationState.locationPermission,
    matchCelebration: mockLocationState.matchCelebration,
    isCurrentDepartement: (code) =>
      Boolean(
        code &&
          mockLocationState.currentDepartementCode &&
          code === mockLocationState.currentDepartementCode
      ),
    resolveCurrentDepartementCode: jest.fn(() =>
      Promise.resolve(mockLocationState.currentDepartementCode)
    ),
    requestForegroundPermission: jest.fn(() => Promise.resolve('granted')),
    requestBackgroundPermission: jest.fn(() => Promise.resolve('granted')),
    refreshTracking: jest.fn(() => Promise.resolve('granted')),
    refreshSettings: jest.fn(() => Promise.resolve({})),
    celebrateMatch: mockCelebrateMatch,
    clearMatchCelebration: mockClearMatchCelebration,
  }),
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
    swipeDownHandler = undefined;
    mockLocationState = {
      currentDepartementCode: null,
      locationPermission: 'undetermined',
      matchCelebration: null,
    };
    mockCelebrateMatch.mockClear();
    mockClearMatchCelebration.mockClear();
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

  it('opens legal information from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Informations légales'));

    expect(screen.getByText('Politique de confidentialité')).toBeTruthy();
    expect(screen.getByText('Conditions d\'utilisation')).toBeTruthy();
    expect(screen.getByText(/ne crée pas de compte utilisateur/)).toBeTruthy();
  });

  it('opens notification settings from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Notifications'));

    expect(screen.getByText('Autorisations système')).toBeTruthy();
    expect(screen.getByText('Localisation')).toBeTruthy();
    expect(screen.getByLabelText('Activer les notifications')).toBeTruthy();
    expect(screen.getByLabelText('Département du jour')).toBeTruthy();
    expect(screen.getByLabelText('Passage de département')).toBeTruthy();
  });

  it('opens help from the header menu', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Aide'));

    expect(screen.getByText('Alertes de passage de département')).toBeTruthy();
    expect(screen.getByText('Que choisir dans les pop-ups ?')).toBeTruthy();
  });

  it('opens help from the notifications screen', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Ouvrir le menu'));
    fireEvent.press(screen.getByLabelText('Notifications'));
    fireEvent.press(screen.getByLabelText("Consulter l'aide"));

    expect(screen.getByText('Que choisir dans les pop-ups ?')).toBeTruthy();
    expect(screen.queryByText('Autorisations système')).toBeNull();
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

  it('does not celebrate when the displayed department already matches geolocation', () => {
    mockLocationState.currentDepartementCode = departements[0].number;

    render(<App />);

    expect(mockCelebrateMatch).not.toHaveBeenCalled();
  });

  it('celebrates a match when random picks the current department', () => {
    const targetIndex = 5;
    mockLocationState.currentDepartementCode = departements[targetIndex].number;

    render(<App />);
    expect(mockCelebrateMatch).not.toHaveBeenCalled();

    jest.spyOn(Math, 'random').mockReturnValue(targetIndex / departements.length);
    act(() => {
      swipeLeftHandler();
    });

    expect(mockCelebrateMatch).toHaveBeenCalledWith(departements[targetIndex].number);
  });

  it('celebrates a match when search selects the current department', () => {
    mockLocationState.currentDepartementCode = '75';

    render(<App />);
    mockCelebrateMatch.mockClear();

    openSearchOverlay();
    fireEvent.changeText(
      screen.getByPlaceholderText('Rechercher par numéro ou nom...'),
      'Paris'
    );
    fireEvent.press(screen.getByText('Paris'));

    expect(mockCelebrateMatch).toHaveBeenCalledWith('75');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DepartementDetailStrip from '../../components/DepartementDetailStrip';
import { departements } from '../../data/departements';

describe('DepartementDetailStrip', () => {
  const paris = departements.find((dept) => dept.number === '75');

  it('shows a match label when viewing the current department', () => {
    render(
      <DepartementDetailStrip
        item={paris}
        isDetailView={false}
        isCurrentLocation
        onPress={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("C'est un match !")).toBeTruthy();
    expect(screen.queryByText(/Préfecture/)).toBeNull();
  });

  it('shows the prefecture subtitle for other departments', () => {
    render(
      <DepartementDetailStrip
        item={paris}
        isDetailView={false}
        isCurrentLocation={false}
        onPress={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Préfecture/)).toBeTruthy();
    expect(screen.queryByText("C'est un match !")).toBeNull();
  });
});

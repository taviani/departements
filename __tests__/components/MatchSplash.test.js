import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import MatchSplash from '../../components/MatchSplash';

describe('MatchSplash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows match copy and calls onFinish after the animation', () => {
    const onFinish = jest.fn();

    render(
      <MatchSplash
        departement={{ number: '75', name: 'Paris' }}
        onFinish={onFinish}
      />
    );

    expect(screen.getByText("C'est un match !")).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('Paris')).toBeTruthy();

    act(() => {
      jest.runAllTimers();
    });

    expect(onFinish).toHaveBeenCalled();
  });
});

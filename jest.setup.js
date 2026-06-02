require('react-native-reanimated').setUpTests();

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GestureHandlerRootView: ({ children, style }) =>
      React.createElement(View, { style }, children),
    Gesture: {
      Pinch: () => ({
        onBegin: () => ({ onBegin: () => ({}) }),
        onUpdate: () => ({ onUpdate: () => ({}) }),
        onEnd: () => ({ onEnd: () => ({}) }),
      }),
      Pan: () => ({
        maxPointers: () => ({
          minDistance: () => ({
            manualActivation: () => ({
              onTouchesMove: () => ({
                onBegin: () => ({
                  onUpdate: () => ({
                    onEnd: () => ({}),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
      Tap: () => ({
        numberOfTaps: () => ({
          maxDuration: () => ({
            onEnd: () => ({}),
          }),
        }),
      }),
      Simultaneous: (...gestures) => gestures[0] ?? {},
    },
    GestureDetector: ({ children }) => children,
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./components/AnimatedSplash', () => {
  const React = require('react');
  return function MockAnimatedSplash() {
    return null;
  };
});

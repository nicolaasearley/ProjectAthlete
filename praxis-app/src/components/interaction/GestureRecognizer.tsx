import React, { useState } from 'react';
import { PanResponder, View } from 'react-native';

interface GestureRecognizerProps {
  children: React.ReactNode;
  index: number;
  total: number;
  onStart?: (index: number) => void;
  onMove?: (hoverIndex: number) => void;
  onEnd?: () => void;
}

export function GestureRecognizer({
  children,
  index,
  total,
  onStart,
  onMove,
  onEnd,
}: GestureRecognizerProps) {
  const [layoutTop, setLayoutTop] = useState(0);
  const [height, setHeight] = useState(0);

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      onStart?.(index);
    },
    onPanResponderMove: (_, gesture) => {
      const y = layoutTop + gesture.dy;
      const hover = Math.min(
        total - 1,
        Math.max(0, Math.floor(y / height))
      );
      onMove?.(hover);
    },
    onPanResponderRelease: () => {
      onEnd?.();
    },
  });

  return (
    <View
      {...responder.panHandlers}
      onLayout={(ev) => {
        const { y, height: h } = ev.nativeEvent.layout;
        setLayoutTop(y);
        setHeight(h);
      }}
    >
      {children}
    </View>
  );
}


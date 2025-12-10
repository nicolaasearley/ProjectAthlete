import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@theme';

interface ReadinessMiniGraphProps {
  data?: number[];
}

export function ReadinessMiniGraph({ data = [] }: ReadinessMiniGraphProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 40,
        marginVertical: 4,
      }}
    >
      {data.map((val, idx) => {
        const height = (val / 100) * 40;
        const color =
          val < 40
            ? '#FF4F4F'
            : val < 70
              ? theme.colors.primary
              : '#7AF3FF';

        return (
          <View
            key={idx}
            style={{
              width: 10,
              height,
              backgroundColor: color,
              marginRight: 4,
              borderRadius: 3,
            }}
          />
        );
      })}
    </View>
  );
}


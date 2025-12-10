import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme';

export default function EquipmentSelectionScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.appBg }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Equipment Selection
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

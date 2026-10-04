import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sisa</Text>
      <Text style={styles.subtitle}>Pencatat Keuangan Pribadi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1D1B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5E6661',
  },
});

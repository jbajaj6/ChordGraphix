import { Slot } from 'expo-router';
import { ChordColorsProvider } from '../src/ChordColorsContext';

export default function RootLayout() {
  return (
    <ChordColorsProvider>
      <Slot />
    </ChordColorsProvider>
  );
}
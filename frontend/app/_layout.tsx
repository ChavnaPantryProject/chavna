// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Used this to hide the headers, set to true if we need them again
      }}
    />
  );
}

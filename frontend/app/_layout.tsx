import { HeaderShownContext } from "@react-navigation/elements";
import { Stack } from "expo-router";
//import SafeScreen from "@/components/SafeScreen";

export default function RootLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}></Stack>
  );
}
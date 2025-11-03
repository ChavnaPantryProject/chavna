// app/meal/_layout.tsx

import { Slot } from "expo-router";

export const unstable_settings = {
    tabBarStyle: { display: "none"},
};

export default function MealLayout() {
    return <Slot />;
}
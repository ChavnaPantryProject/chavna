// app/meal/_layout.tsx

import { Slot, Stack } from "expo-router";

export const unstable_settings = {
    tabBarStyle: { display: "none"},
};

export default function MealLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // keep custom headers
                animation: "slide_from_right", // default animation for forward navigation
            }}
        >
            {/* define transitions for each screen */}
            <Stack.Screen
                name="meal"
                options={{
                    animation: "slide_from_left", // when navigating back
                }}
            />
            <Stack.Screen name="meal_ingredient" />
            <Stack.Screen name="editmeal" />
            <Stack.Screen name="mealinfo" />
        </Stack>
    );
}
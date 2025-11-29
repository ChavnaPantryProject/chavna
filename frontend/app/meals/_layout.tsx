// app/meal/_layout.tsx

import { Stack } from "expo-router";

export const unstable_settings = {
    tabBarStyle: { display: "none"},
};

export default function MealLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // keep custom headers
                animation: "default", // default animation for forward navigation
                gestureEnabled: true,
                gestureDirection: "horizontal",
                fullScreenGestureEnabled: true,
            }}
        >
            {/* define transitions for each screen */}
            <Stack.Screen
                name="newmeal"
                options={{
                    animation: "slide_from_right", // when navigating back
                    presentation: "card",
                }}
            />
            <Stack.Screen 
                name="meal_ingredient" 
                options={{
                    animation: "slide_from_right",
                    presentation: "card",
                }}
            />
            <Stack.Screen 
                name="editmeal"
                options={{
                    animation: "slide_from_right",
                    presentation: "card",
                }}
            />
            <Stack.Screen 
                name="mealinfo"
                options={{
                    animation: "slide_from_right",
                    presentation: "card",
                }}
            />
            <Stack.Screen
                name="(tabs)/meal"
                options={{
                    animation: "slide_from_left",
                    presentation: "card",
                }}
            />
        </Stack>
    );
}
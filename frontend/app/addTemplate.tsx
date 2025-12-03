// app/addTemplate.tsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { API_URL, retrieveValue, Response } from "./util";
import { Picker } from "@react-native-picker/picker";
import { setSelectedTemplate, Template } from "./select-template";

export default function AddTemplateScreen() {
    // Template fields
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [unit, setUnit] = useState("");
    const [shelfLifeDays, setShelfLifeDays] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState<string[]>([]);

    // Load categories + templates once
    useEffect(() => {
        (async () => {
            try {
                const jwt = await retrieveValue("jwt");
                if (!jwt) {
                    console.log("No JWT, cannot load categories/templates");
                    return;
                }

                // 1) Categories
                const catRes = await fetch(`${API_URL}/get-categories`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${jwt}` },
                });

                if (catRes.ok) {
                    const catBody: Response<{categories: string[]}> = await catRes.json();
                    if (catBody.success === 'success')
                        setCategories(catBody.payload!.categories.sort());
                } else {
                    console.log("get-categories status:", catRes.status);
                }

                console.log(categories);
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        })();
    }, []);

    /**
     * Ensure the given category exists for this user.
     * If not present, call /create-category first.
     * This version is defensive against backend 500s that still insert the row.
     */
    const ensureCategoryExists = async (
        categoryName: string,
        jwt: string
    ): Promise<void> => {
        const trimmed = categoryName.trim();
        if (!trimmed) return;

        // If we already know about it locally, don't call the API
        if (categories.includes(trimmed)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/create-category`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: trimmed }),
            });

            const body = await res.json();
            console.log(
                "create-category response:",
                JSON.stringify(body, null, 2)
            );

            const msg = body?.message ?? "";

            if (!res.ok && msg !== "Category already exists.") {
                // Backend returned 500 or some other error.
                // But sometimes it *still* inserts the category and then crashes.
                console.warn("create-category returned non-OK:", msg);

                // Try to refresh categories from the server to see what actually exists now
                try {
                    const catRes = await fetch(`${API_URL}/get-categories`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${jwt}` },
                    });
                    const catBody = await catRes.json();
                    const serverCats: string[] = catBody?.categories ?? [];
                    console.log(
                        "refreshed categories after create-category error:",
                        serverCats
                    );
                    setCategories(serverCats);

                    if (!serverCats.includes(trimmed)) {
                        console.warn(
                            "Category still missing after 500 from create-category"
                        );
                    }
                } catch (innerErr) {
                    console.error(
                        "Failed to refresh categories after create-category error:",
                        innerErr
                    );
                }

                // Important: DO NOT throw – let onSave continue and let the template API decide
                return;
            }

            // Success or "already exists": update local list so we don't call again
            setCategories((prev) =>
                prev.includes(trimmed) ? prev : [...prev, trimmed]
            );
        } catch (err) {
            console.error("ensureCategoryExists error:", err);
            // Don't rethrow; we don't want to kill the save flow on a noisy backend
            // The later create-food-item-template call will surface any real problems.
        }
    };


    const onSave = async () => {
        // Basic validation
        if (!name.trim()) {
            Alert.alert("Missing name", "Please enter an item name.");
            return;
        }
        if (!amount || isNaN(Number(amount))) {
            Alert.alert("Invalid amount", "Amount must be a number.");
            return;
        }
        if (!category.trim()) {
            Alert.alert("Missing category", "Please enter a category.");
            return;
        }

        if (!shelfLifeDays || isNaN(Number(shelfLifeDays))) {
            Alert.alert("Invalid shelf life", "Amount must be a number.");
            return;
        }

        const trimmedCategory = category.trim();

        try {
            setLoading(true);
            const jwt = await retrieveValue("jwt");
            if (!jwt) {
                Alert.alert("Not logged in", "Please log in again.");
                return;
            }

            // 1) Make sure the category exists (auto-create if needed)
            await ensureCategoryExists(trimmedCategory, jwt);

            // 2) Now create the template
            const createRes = await fetch(
                `${API_URL}/create-food-item-template`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        amount: Number(amount),
                        unit: unit.trim(),
                        shelfLifeDays: Number(shelfLifeDays),
                        category: trimmedCategory,
                    }),
                }
            );

            type ResponseTemplate = {
                name: string,
                amount: number, // Default amount for a given food item. This is only for the front end to auto populate an amount field if necessary.
                unit: string,
                shelfLifeDays: number, // Shelf life in days (should be an integer)
                category: string // Must match a user category. Will not add if the category has not been added first.
            };

            type RegisteredTemplate = {
                templateId: string,
                template: ResponseTemplate
            };

            const createBody: Response<RegisteredTemplate> = await createRes.json();

            if (!createRes.ok || createBody.success !== "success") {
                const msg =
                    createBody?.message ||
                    "Template could not be created. It may already exist.";
                Alert.alert("Error creating template", msg);
                return;
            }

            const templateId = createBody.payload?.templateId;
            if (!templateId) {
                Alert.alert(
                    "Error",
                    "Template created but no templateId was returned."
                );
                return;
            }

            const template: Template = {
                id: createBody.payload!.templateId,
                ...createBody.payload!.template
            }
            
            setSelectedTemplate(template);
            router.back();
        } catch (err: any) {
            console.error("Error saving template & item:", err);
            Alert.alert(
                "Error",
                err?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Hide native header and use custom one so we can style underline freely */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom header with back arrow */}
            <View style={styles.customHeader}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </Pressable>

                <Text style={styles.customHeaderTitle}>New Item</Text>

                {/* Spacer so title stays visually centered */}
                <View style={{ width: 24 }} />
            </View>


            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top section: template info */}
                <Text style={styles.label}>Item Name</Text>
                <View style={{ position: "relative" }}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Chicken Breast"
                    />
                </View>

                <Text style={styles.label}>Default Amount</Text>
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="1"
                />

                <Text style={styles.label}>Unit</Text>
                <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="lb, pack, oz"
                />

                <Text style={styles.label}>Shelf Life (Days)</Text>
                <TextInput
                    style={styles.input}
                    value={shelfLifeDays}
                    onChangeText={setShelfLifeDays}
                    keyboardType="numeric"
                    placeholder="12"
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.picker}>
                    <Picker<string>
                        selectedValue={categories[0]}
                        onValueChange={(value) => setCategory(value)}
                    >
                        {categories.map(category => (
                            <Picker.Item label={category} value={category}/>
                        ))}
                    </Picker>
                </View>

                <View style={styles.divider} />
                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        (pressed || loading) && { opacity: 0.85 },
                    ]}
                    onPress={onSave}
                    disabled={loading}
                >
                    <View style={styles.saveContent}>
                        <Text style={styles.saveText}>
                            {loading ? "Adding Item..." : "Add Item"}
                        </Text>
                    </View>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    customHeader: {
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#4CAF50", // thin green underline
    },
    backBtn: {
        paddingRight: 8,
        paddingVertical: 4,
    },
    customHeaderTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    container: {
        padding: 16,
        paddingBottom: 32,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#FFFFFF",
    },
    picker: {
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 8,
        // paddingHorizontal: 10,
        // paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#FFFFFF",
    },
    helpText: {
        fontSize: 12,
        color: "#666666",
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "#E2E2E2",
        marginVertical: 16,
    },
    saveButton: {
        marginTop: 12,
        backgroundColor: "#F3A261",
        paddingVertical: 14,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        minWidth: 220,
        borderWidth: 2,
        borderColor: "#d9893c", // darker outline for visibility
    },
    saveContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    saveText: {
        color: "#5c3b14", // higher-contrast text
        fontWeight: "700",
        fontSize: 16,
    },
    suggestionsBox: {
        position: "absolute",
        top: 44,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 8,
        zIndex: 1000,
        elevation: 10,
        maxHeight: 200,
    },
    suggestionRow: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#EEEEEE",
    },
    suggestionName: {
        fontSize: 15,
        fontWeight: "600",
    },
    suggestionMeta: {
        fontSize: 12,
        color: "#777777",
        marginTop: 2,
    },
});

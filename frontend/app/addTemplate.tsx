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

type Template = {
    templateId?: string;
    id?: string;
    name: string;
    amount: number;
    unit: string;
    shelfLifeDays?: number;
    category: string;
};

type Suggestion = Template & { localKey: string };

export default function AddTemplateScreen() {
    // Template fields
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [unit, setUnit] = useState("");
    const [category, setCategory] = useState("");

    // Item-only fields
    const [shelfLifeDays, setShelfLifeDays] = useState(""); // in days
    const [unitPrice, setUnitPrice] = useState("");

    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // All templates from backend (loaded once)
    const [templates, setTemplates] = useState<Template[]>([]);
    // Filtered suggestions for the dropdown
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        null
    );

    // Load categories + templates once
    useEffect(() => {
        const load = async () => {
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
                    const catBody = await catRes.json();
                    console.log("get-categories body:", catBody);
                    if (catBody && Array.isArray(catBody.categories)) {
                        setCategories(catBody.categories);
                    }
                } else {
                    console.log("get-categories status:", catRes.status);
                }

                // 2) Templates (no search -> all templates for this user)
                const tplRes = await fetch(
                    `${API_URL}/get-food-item-templates`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${jwt}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({}), // omit search
                    }
                );

                console.log("get-food-item-templates status:", tplRes.status);

                const tplBody = await tplRes.json();
                console.log(
                    "get-food-item-templates body:",
                    JSON.stringify(tplBody, null, 2)
                );

                if (!tplRes.ok) {
                    return;
                }

                // Actual shape:
                // payload: [
                //   { templateId, template: { name, amount, unit, shelfLifeDays, category } }
                // ]
                let rawTemplates: any[] = [];

                if (Array.isArray(tplBody?.payload)) {
                    rawTemplates = tplBody.payload;
                } else if (Array.isArray(tplBody?.payload?.templates)) {
                    rawTemplates = tplBody.payload.templates;
                } else if (Array.isArray(tplBody?.templates)) {
                    rawTemplates = tplBody.templates;
                }

                console.log(
                    "rawTemplates length (initial load):",
                    rawTemplates.length
                );

                const mapped: Template[] = rawTemplates.map((t: any) => {
                    const inner = t.template ?? {};
                    return {
                        templateId: t.templateId ?? t.id,
                        id: t.id,
                        name: inner.name,
                        amount: inner.amount,
                        unit: (inner.unit ?? "").trim(),
                        shelfLifeDays: inner.shelfLifeDays,
                        category: inner.category,
                    };
                });

                setTemplates(mapped);
                console.log("mapped templates:", mapped);
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };

        load();
    }, []);

    // Called when user types in the Item Name field
    const handleNameChange = (text: string) => {
        console.log("handleNameChange text:", text);
        setName(text);
        setSelectedTemplate(null);

        const query = text.trim().toLowerCase();
        console.log("templates length at type:", templates.length);

        if (query.length < 2) {
            console.log("Query too short, clearing suggestions");
            setSuggestions([]);
            return;
        }

        // Filter locally from the templates we already loaded
        const filtered = templates.filter(
            (t) =>
                typeof t.name === "string" &&
                t.name.toLowerCase().startsWith(query)
        );

        const mapped: Suggestion[] = filtered.map((t, idx) => ({
            ...t,
            localKey: `${t.templateId || t.id || t.name}-${idx}`,
        }));

        console.log("filtered suggestions length:", mapped.length);
        setSuggestions(mapped);
    };

    const handleSelectSuggestion = (tpl: Suggestion) => {
        console.log("handleSelectSuggestion:", tpl.name);
        setName(tpl.name);
        setAmount(String(tpl.amount ?? ""));
        setUnit(tpl.unit ?? "");
        setCategory(tpl.category ?? "");
        setShelfLifeDays(
            tpl.shelfLifeDays !== undefined && tpl.shelfLifeDays !== null
                ? String(tpl.shelfLifeDays)
                : ""
        );
        setSelectedTemplate(tpl);
        setSuggestions([]); // hide dropdown once chosen
    };

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
        if (!unitPrice || isNaN(Number(unitPrice))) {
            Alert.alert("Invalid price", "Unit price must be a number.");
            return;
        }
        if (
            shelfLifeDays.trim() !== "" &&
            isNaN(Number(shelfLifeDays.trim()))
        ) {
            Alert.alert(
                "Invalid shelf life",
                "Shelf life must be a number of days."
            );
            return;
        }

        const shelfLifeValue =
            shelfLifeDays.trim() === "" ? 0 : Number(shelfLifeDays.trim());
        const trimmedCategory = category.trim();

        try {
            setLoading(true);
            const jwt = await retrieveValue("jwt");
            if (!jwt) {
                Alert.alert("Not logged in", "Please log in again.");
                return;
            }

            // Try to reuse templateId if selected
            let templateId: string | undefined =
                selectedTemplate?.templateId || selectedTemplate?.id;

            // If no usable id, create a new template
            if (!templateId) {
                console.log("No template selected, creating new template");

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
                            shelfLifeDays: shelfLifeValue,
                            category: trimmedCategory,
                        }),
                    }
                );

                const createBody: Response = await createRes.json();
                console.log(
                    "create-food-item-template response:",
                    JSON.stringify(createBody, null, 2)
                );

                if (!createRes.ok || createBody.success !== "success") {
                    const msg =
                        createBody?.message ||
                        "Template could not be created. It may already exist.";
                    Alert.alert("Error creating template", msg);
                    return;
                }

                templateId = createBody.payload?.templateId;
                if (!templateId) {
                    Alert.alert(
                        "Error",
                        "Template created but no templateId was returned."
                    );
                    return;
                }

                // Also push new template into local list so it appears next time
                const tplInner = (createBody as any).payload?.template ?? {};
                const newTemplate: Template = {
                    templateId,
                    name: tplInner.name ?? name.trim(),
                    amount: tplInner.amount ?? Number(amount),
                    unit: (tplInner.unit ?? unit).trim(),
                    shelfLifeDays:
                        tplInner.shelfLifeDays ?? shelfLifeValue ?? 0,
                    category: tplInner.category ?? trimmedCategory,
                };
                setTemplates((prev) => [...prev, newTemplate]);
            }

            console.log("Using templateId:", templateId);

            // Add item to inventory (no expiration now)
            const addRes = await fetch(`${API_URL}/add-food-items`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: [
                        {
                            templateId,
                            amount: Number(amount),
                            unitPrice: Number(unitPrice),
                        },
                    ],
                }),
            });

            const addBody: Response = await addRes.json();
            console.log(
                "add-food-items response:",
                JSON.stringify(addBody, null, 2)
            );

            if (!addRes.ok || addBody.success !== "success") {
                const msg =
                    addBody?.message ||
                    "The template was saved, but the item could not be added to inventory.";
                Alert.alert("Error adding item", msg);
                return;
            }

            Alert.alert("Item added", "The item was added to your inventory.", [
                { text: "OK", onPress: () => router.back() },
            ]);
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

                <Text style={styles.customHeaderTitle}>Add Item</Text>

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
                        onChangeText={handleNameChange}
                        placeholder="Chicken Breast"
                    />

                    {/* Suggestions dropdown */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsBox}>
                            {suggestions.map((tpl) => (
                                <Pressable
                                    key={tpl.localKey}
                                    onPress={() => handleSelectSuggestion(tpl)}
                                    style={({ pressed }) => [
                                        styles.suggestionRow,
                                        pressed && { backgroundColor: "#F1F1F1" },
                                    ]}
                                >
                                    <Text style={styles.suggestionName}>
                                        {tpl.name}
                                    </Text>
                                    <Text style={styles.suggestionMeta}>
                                        {tpl.category} · {tpl.amount} {tpl.unit}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
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

                <Text style={styles.label}>Category</Text>
                <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Protein, Vegetables"
                />
                {categories.length > 0 && (
                    <Text style={styles.helpText}>
                        Existing categories: {categories.join(", ")}
                    </Text>
                )}

                <View style={styles.divider} />

                {/* Second section: shelf life + price */}
                <Text style={styles.sectionTitle}>Item Details</Text>

                <Text style={styles.label}>Shelf Life (days)</Text>
                <TextInput
                    style={styles.input}
                    value={shelfLifeDays}
                    onChangeText={setShelfLifeDays}
                    keyboardType="number-pad"
                    placeholder="7"
                />

                <Text style={styles.label}>Unit Price</Text>
                <TextInput
                    style={styles.input}
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    keyboardType="decimal-pad"
                    placeholder="4.99"
                />

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
                            {loading ? "Saving…" : "Add Item"}
                        </Text>
                        {!loading && (
                            <Ionicons
                                name="arrow-forward-outline"
                                size={18}
                                color="#5c3b14"
                            />
                        )}
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

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

import { API_URL, retrieveValue, Response, goBackWithParams } from "./util";

type Template = {
    id: string,
    name: string,
    amount: number, // Default amount for a given food item. This is only for the front end to auto populate an amount field if necessary.
    unit: string,
    shelfLifeDays: number, // Shelf life in days (should be an integer)
    category: string // Must match a user category. Will not add if the category has not been added first.
};

async function getTemplates(): Promise<Template[]> {
    const jwt = await retrieveValue('jwt');
    const request = {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
    };
    const response = await fetch(`${API_URL}/get-food-item-templates`, request);

    if (response === null)
        return [];

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

    const body: Response<RegisteredTemplate[]> = await response.json();

    if (body === null)
        return [];

    if (body.success !== "success") {
        console.error(body);
        return [];
    }

    const templates: Template[] = body.payload!.map(v => {
        return {
            id: v.templateId,
            name: v.template.name,
            amount: v.template.amount,
            unit: v.template.unit,
            shelfLifeDays: v.template.shelfLifeDays,
            category: v.template.category
        };
    });

    return templates;
}

function filterTemplates(filter: string, templates: Template[]): Template[] {
    if (filter === "")
        return templates;

    let filtered = [];
    for (const template of templates) {
        if (template.name.toLowerCase().includes(filter))
            filtered.push(template);
    }

    return filtered;
}

export default function main() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const [filter, setFilter] = useState<string>("");

    const selectTemplate = (templateId: string) => {
        goBackWithParams(router, {
            selectedTemplate: templateId
        });
    }

    useEffect(() => {
        setFilteredTemplates(filterTemplates(filter, templates));
    }, [templates, filter])

    useEffect(() => {
        (async () => {
            setTemplates(await getTemplates())
        })();
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Hide native header and use custom one so we can style underline freely */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom header with back arrow */}
            <View style={styles.customHeader}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </Pressable>

                <Text style={styles.customHeaderTitle}>Select Item</Text>

                {/* Spacer so title stays visually centered */}
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.container}>
                {/* Top section: template info */}
                <View style={styles.input}> 
                    <Ionicons 
                        name="search" 
                        size={22} 
                        // color="#499F44" 
                        style={{ marginRight: 6}} 
                    />
                    <TextInput
                        style={styles.inputText}
                        // value={""}
                        onChangeText={(text) => setFilter(text.trim())}
                        placeholder="Search"
                    />
                </View>

                <View style={styles.divider}/>

                <ScrollView
                    style={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                {filteredTemplates.map((template, i) => (
                    <Pressable 
                        key={template.id}
                        onPress={() => selectTemplate(template.id)}
                    >
                        <Text style={
                            [styles.templateOption, i == 0 && {borderTopWidth: 0}]
                        }>{template.name}</Text>
                    </Pressable>
                ))}
                </ScrollView> 

                <View style={styles.divider}/>
                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        (pressed) && { opacity: 0.85 },
                    ]}
                    onPress={() => router.push('/addTemplate')}
                    // disabled={loading}
                >
                    <View style={styles.saveContent}>
                        <Text style={styles.saveText}>
                            {"Add Item"}
                        </Text>
                    </View>
                </Pressable>
            </View>

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
    scroll: {
        paddingLeft: 8,
        paddingRight: 8,
        height: "75%",
        overflow: "hidden"
    },
    templateOption: {
        padding: 16,
        borderTopWidth: 0.5,
        borderColor: "#AAAAAA",
        // backgroundColor: "#EEEEEE",
        textAlignVertical: "center",
        textAlign: "center",
        fontSize: 18,
        margin: 0
    },
    // sectionTitle: {
    //     fontSize: 18,
    //     fontWeight: "700",
    //     marginBottom: 4,
    // },
    // label: {
    //     fontSize: 15,
    //     fontWeight: "600",
    //     marginTop: 8,
    // },
    input: {
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#FFFFFF",
        flexDirection: "row"
    },
    inputText: {
        // width: 0,
        // height: 0,
        padding: 0,
        margin: 0
    },
    // helpText: {
    //     fontSize: 12,
    //     color: "#666666",
    //     marginTop: 4,
    // },
    divider: {
        height: 1,
        backgroundColor: "#E2E2E2",
        // marginVertical: 16,
        margin: 0
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
    // suggestionsBox: {
    //     position: "absolute",
    //     top: 44,
    //     left: 0,
    //     right: 0,
    //     backgroundColor: "#FFFFFF",
    //     borderWidth: 1,
    //     borderColor: "#CCCCCC",
    //     borderRadius: 8,
    //     zIndex: 1000,
    //     elevation: 10,
    //     maxHeight: 200,
    // },
    // suggestionRow: {
    //     paddingHorizontal: 10,
    //     paddingVertical: 8,
    //     borderBottomWidth: StyleSheet.hairlineWidth,
    //     borderBottomColor: "#EEEEEE",
    // },
    // suggestionName: {
    //     fontSize: 15,
    //     fontWeight: "600",
    // },
    // suggestionMeta: {
    //     fontSize: 12,
    //     color: "#777777",
    //     marginTop: 2,
    // },
});

// empty screen for new meal creation
// implement the empty picture option.

// NOTE: this will be the default screen when a usesr decides to add a new meal/

import React from "react";
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"


export default function ScannerScreen(){
	const router = useRouter();
	//const router = { push: (path) => alert(`Navigate to: ${path}`) };

	return (
		<View style={styles.container}>
			{/* Scanner area */}
			<View style={styles.topBar}>
		</View>
			<View style={styles.scannerArea}>
				<View style={styles.cornerTopLeft} />
				<View style={styles.cornerTopRight} />
				<View style={styles.cornerBottomLeft} />
				<View style={styles.cornerBottomRight} />
			</View>

			{/* Bottom navigation bar */}
			<View style={styles.bottomBar}>
				{/* Left Button */}
				<TouchableOpacity style={styles.iconButton}>
					<Ionicons name="stats-chart" size={28} color="white" />
				</TouchableOpacity>

				{/* Middle Button */}
				<TouchableOpacity style={styles.cameraButton}
				onPress={() => router.push("/scannerConfirmation")}>
					<View style={styles.cameraInnerCircle} />
				</TouchableOpacity>

				{/* Right Button */}
				<TouchableOpacity
					style={styles.iconButton}
					//onPress={() => router.push("/(tabs)/index")}
					onPress={() => router.push("/")}
				>
					<Ionicons name="home-outline" size={28} color="white" />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#DCEFD7",
		justifyContent: "space-between",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		height: 70,
		paddingVertical: 20,
		backgroundColor: "#499F4458",
	},
	scannerArea: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	cornerTopLeft: {
		position: "absolute",
		top: 20,
		left: 20,
		width: 30,
		height: 30,
		borderTopWidth: 3,
		borderLeftWidth: 3,
		borderColor: "black",
	},
	cornerTopRight: {
		position: "absolute",
		top: 20,
		right: 20,
		width: 30,
		height: 30,
		borderTopWidth: 3,
		borderRightWidth: 3,
		borderColor: "black",
	},
	cornerBottomLeft: {
		position: "absolute",
		bottom: 20,
		left: 20,
		width: 30,
		height: 30,
		borderBottomWidth: 3,
		borderLeftWidth: 3,
		borderColor: "black",
	},
	cornerBottomRight: {
		position: "absolute",
		bottom: 20,
		right: 20,
		width: 30,
		height: 30,
		borderBottomWidth: 3,
		borderRightWidth: 3,
		borderColor: "black",
	},
	bottomBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		paddingVertical: 20,
		backgroundColor: "#499F4458",
	},
	iconButton: {
		padding: 10,
	},
	cameraButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "white",
		justifyContent: "center",
		alignItems: "center",
	},
	cameraInnerCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#499F44",
	},
});

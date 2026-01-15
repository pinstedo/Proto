import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StatusBar, View } from "react-native";
import { styles } from "./style/stylesheet";

export default function SplashScreen() {
	const router = useRouter();

	useEffect(() => {
		const t = setTimeout(() => {
			// replace so that the splash is not in the back stack
			router.replace("/auth/authentication");
		}, 2500);

		return () => clearTimeout(t);
	}, [router]);

	return (
		<View style={[styles.container, { padding: 0 }]}>
			<StatusBar hidden />
			<Image
				style={[styles.image, { width: 250, height: 250 }]}
				source={require("./../assets/images/logo11.png")}
				resizeMode="contain"
			/>
		</View>
	);
}


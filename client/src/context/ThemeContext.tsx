import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeType = "light" | "dark";

interface ThemeContextType {
    theme: ThemeType;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>(systemColorScheme === "dark" ? "dark" : "light");

    useEffect(() => {
        // Load saved theme on mount
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem("appTheme");
                if (savedTheme === "light" || savedTheme === "dark") {
                    setTheme(savedTheme);
                }
            } catch (error) {
                console.error("Failed to load theme", error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const newTheme = theme === "light" ? "dark" : "light";
            setTheme(newTheme);
            await AsyncStorage.setItem("appTheme", newTheme);
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    };

    const isDark = theme === "dark";

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

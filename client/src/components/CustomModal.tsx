import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ModalType = 'default' | 'success' | 'date' | 'error' | 'confirmation' | 'warning';

interface ModalAction {
    text: string;
    onPress: () => void;
    style?: 'cancel' | 'destructive' | 'default';
}

interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    children?: React.ReactNode;
    type?: ModalType;
    actions?: ModalAction[];
}

export const CustomModal: React.FC<CustomModalProps> = ({
    visible,
    onClose,
    title,
    message,
    children,
    type = 'default',
    actions = [],
}) => {
    const getIconName = () => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'confirmation': return 'help';
            case 'date': return 'calendar-today';
            default: return null;
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FFC107';
            case 'confirmation': return '#0a84ff';
            case 'date': return '#0a84ff';
            default: return '#333';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.content} onStartShouldSetResponder={() => true}>
                    {type !== 'default' && (
                        <View style={styles.iconContainer}>
                            <MaterialIcons name={getIconName() as any} size={48} color={getIconColor()} />
                        </View>
                    )}

                    {title && <Text style={styles.title}>{title}</Text>}
                    {message && <Text style={styles.message}>{message}</Text>}

                    {children}

                    {actions.length > 0 && (
                        <View style={styles.actionsContainer}>
                            {actions.map((action, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        action.style === 'cancel' && styles.cancelButton,
                                        action.style === 'destructive' && styles.destructiveButton,
                                        action.style === 'default' && styles.defaultButton,
                                        index > 0 && { marginLeft: 10 }
                                    ]}
                                    onPress={action.onPress}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            action.style === 'cancel' && styles.cancelButtonText,
                                            action.style === 'destructive' && styles.destructiveButtonText,
                                            action.style === 'default' && styles.defaultButtonText,
                                        ]}
                                    >
                                        {action.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    defaultButton: {
        backgroundColor: '#0a84ff',
    },
    destructiveButton: {
        backgroundColor: '#F44336',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    defaultButtonText: {
        color: 'white',
    },
    destructiveButtonText: {
        color: 'white',
    },
    cancelButtonText: {
        color: '#333',
    },
});

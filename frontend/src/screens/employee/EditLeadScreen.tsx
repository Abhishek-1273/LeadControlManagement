import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../api/axiosInstance';
import { useLeadStore } from '../../store/leadStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const InputField = ({
    label, value, onChangeText, placeholder,
    keyboardType, icon
}: any) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                keyboardType={keyboardType || 'default'}
                autoCapitalize="words"
            />
        </View>
    </View>
);

export default function EditLeadScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { leadId } = route.params || {};
    const { selectedLead, fetchLeadById } = useLeadStore();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [car, setCar] = useState('');
    const [campaign, setCampaign] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedLead) {
            setName(selectedLead.name || '');
            setPhone(selectedLead.phone || '');
            setEmail(selectedLead.email || '');
            setCity(selectedLead.city || '');
            setCar(selectedLead.car || '');
            setCampaign(selectedLead.campaign || '');
        }
    }, [selectedLead]);

    const handleSave = async () => {
        const cleanPhone = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
        if (!name || !cleanPhone) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields ❌',
                text2: 'Name and phone are required',
            });
            return;
        }
        if (!/^\d{10}$/.test(cleanPhone)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Phone ❌',
                text2: 'Phone must be exactly 10 digits (no country code)',
            });
            return;
        }
        setIsLoading(true);
        try {
            await axiosInstance.patch(`/leads/${leadId}/info`, {
                name, phone: cleanPhone, email, city, car, campaign,
            });
            await fetchLeadById(leadId);
            Toast.show({
                type: 'success',
                text1: 'Lead Updated ✅',
                text2: 'Lead information saved successfully',
                visibilityTime: 2000,
            });
            navigation.goBack();
        } catch (err: any) {
            const status = err?.response?.status;
            const msg: string = err?.response?.data?.message || 'Could not update lead information';
            if (status === 409) {
                Toast.show({
                    type: 'error',
                    text1: 'Duplicate Phone ⚠️',
                    text2: msg,
                    visibilityTime: 3000,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed ❌',
                    text2: msg,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Lead Info</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveBtnText}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: 300 }]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    {/* Customer Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Information</Text>

                        <InputField
                            label="Full Name *"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter customer name"
                            icon="person-outline"
                        />
                        <InputField
                            label="Phone *"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            icon="call-outline"
                        />
                        <InputField
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter email address"
                            keyboardType="email-address"
                            icon="mail-outline"
                        />
                        <InputField
                            label="City"
                            value={city}
                            onChangeText={setCity}
                            placeholder="Enter city"
                            icon="location-outline"
                        />
                    </View>

                    {/* Lead Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lead Information</Text>

                        <InputField
                            label="Car / Vehicle"
                            value={car}
                            onChangeText={setCar}
                            placeholder="Enter car model"
                            icon="car-outline"
                        />
                        <InputField
                            label="Campaign"
                            value={campaign}
                            onChangeText={setCampaign}
                            placeholder="Enter campaign name"
                            icon="megaphone-outline"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base, paddingVertical: spacing.md,
        backgroundColor: colors.white, borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 40, height: 40, justifyContent: 'center',
        alignItems: 'center', backgroundColor: colors.background,
        borderRadius: 10,
    },
    title: {
        fontSize: typography.lg, fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm, borderRadius: 10,
    },
    saveBtnText: {
        color: colors.white, fontWeight: typography.bold,
        fontSize: typography.sm,
    },
    content: { padding: spacing.base, gap: spacing.md },
    section: {
        backgroundColor: colors.white, borderRadius: 16,
        padding: spacing.base, gap: spacing.md,
        elevation: 1, shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    sectionTitle: {
        fontSize: typography.md, fontWeight: typography.bold,
        color: colors.textPrimary, marginBottom: spacing.xs,
    },
    inputGroup: { gap: spacing.xs },
    label: {
        fontSize: typography.sm, fontWeight: typography.semiBold,
        color: colors.textPrimary,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 12,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    input: {
        flex: 1, fontSize: typography.base, color: colors.textPrimary,
    },
});
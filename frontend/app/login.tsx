import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
    const [mode, setMode] = useState<Mode>('login');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');

    // Focus tracking
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        if (mode === 'login') return email.trim() && pw.trim();
        return name.trim() && email.trim() && pw.trim() && pw2.trim() && pw === pw2;
    }, [mode, name, email, pw, pw2]);

    const onSubmit = () => {
        if (!canSubmit) return;
        // handle submit
    };

    const goToSplash = () => {
        const target: Href = '/';
        router.replace(target);
    };

    const Accent = ({ active }: { active: boolean }) => (
        <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    );

    const inputBorder = (field: string) => ({
        borderColor: focusedField === field ? GREEN : GRAY_LIGHT,
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <KeyboardAvoidingView
                behavior={Platform.select({ ios: 'padding', android: undefined })}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <Pressable style={styles.tab} onPress={() => setMode('login')}>
                            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                                Login
                            </Text>
                            <Accent active={mode === 'login'} />
                        </Pressable>

                        <Pressable style={styles.tab} onPress={() => setMode('signup')}>
                            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                                Create Account
                            </Text>
                            <Accent active={mode === 'signup'} />
                        </Pressable>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {mode === 'signup' && (
                            <>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Your full name"
                                    style={[styles.input, inputBorder('name')]}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    autoCapitalize="words"
                                />
                            </>
                        )}

                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            style={[styles.input, inputBorder('email')]}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={pw}
                            onChangeText={setPw}
                            placeholder="••••••••"
                            style={[styles.input, inputBorder('password')]}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            secureTextEntry
                        />

                        {mode === 'signup' && (
                            <>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    value={pw2}
                                    onChangeText={setPw2}
                                    placeholder="••••••••"
                                    style={[styles.input, inputBorder('confirm')]}
                                    onFocus={() => setFocusedField('confirm')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                />
                            </>
                        )}

                        {mode === 'login' && (
                            <Pressable onPress={() => { }} style={styles.forgotWrap}>
                                <Text style={styles.forgot}>Forgot Password</Text>
                            </Pressable>
                        )}

                        <Pressable
                            onPress={onSubmit}
                            disabled={!canSubmit}
                            style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                        >
                            <Text style={styles.primaryBtnText}>
                                {mode === 'login' ? 'Login' : 'Create Account'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.or}>Or</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Social Buttons */}
                    <View style={styles.socialList}>
                        <SocialButton
                            icon={<Ionicons name="logo-apple" size={18} />}
                            label={mode === 'login' ? 'Login With Apple' : 'Continue With Apple'}
                        />
                        <SocialButton
                            icon={<Ionicons name="logo-google" size={18} color="#DB4437" />}
                            label={mode === 'login' ? 'Login With Google' : 'Continue With Google'}
                        />
                        <SocialButton
                            icon={<Ionicons name="logo-facebook" size={18} color="#1877F2" />}
                            label={mode === 'login' ? 'Login With Facebook' : 'Continue With Facebook'}
                        />
                        <SocialButton
                            icon={<Ionicons name="person" size={18} />}
                            label={mode === 'login' ? 'Login As Guest' : 'Continue As Guest'}
                        />
                    </View>

                    {/* Testing Button */}
                    <Pressable style={styles.testBtn} onPress={goToSplash}>
                        <Text style={styles.testBtnText}>Go to Splash</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <Pressable style={styles.socialBtn}>
            <View style={styles.socialIcon}>{icon}</View>
            <Text style={styles.socialText}>{label}</Text>
        </Pressable>
    );
}

const GREEN = '#2E7D32';
const GRAY_LIGHT = '#E6E6E6';
const BORDER = '#A0A0A0';
const TEXT = '#111';

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 60,
        paddingTop: 16,
        backgroundColor: '#FFFFFF',
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    tab: { flex: 1, alignItems: 'center', paddingBottom: 6 },
    tabText: { fontSize: 16, fontWeight: '700', color: '#9E9E9E' },
    tabTextActive: { color: GREEN },
    tabUnderline: { marginTop: 6, height: 2, width: '70%', backgroundColor: 'transparent' },
    tabUnderlineActive: { backgroundColor: GREEN },

    // Form
    form: { marginTop: 12, gap: 14 },
    label: { fontSize: 15, color: TEXT, fontWeight: '600', marginBottom: 6 },

    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        borderColor: GRAY_LIGHT,
        // Subtle lift
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },

    forgotWrap: { alignSelf: 'flex-end', marginTop: 6 },
    forgot: { color: GREEN, fontWeight: '600' },

    // Primary button
    primaryBtn: {
        backgroundColor: '#9ACB9F',
        borderColor: '#2E7D32',
        borderWidth: 1.5,
        borderRadius: 22,
        paddingVertical: 10,
        paddingHorizontal: 36,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    primaryBtnDisabled: {
        backgroundColor: '#C9E1CB',
        borderColor: '#7FBF8E',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
        // Faint gray outline around letters (~15% opacity)
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 1.5,
    },

    // Divider row
    dividerRow: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    divider: { flex: 1, height: 2, backgroundColor: GREEN },
    or: { color: '#444', fontWeight: '600' },

    // Social buttons
    socialList: { marginTop: 8, gap: 12 },
    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: GRAY_LIGHT,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    socialIcon: { width: 26, alignItems: 'center' },
    socialText: { marginLeft: 10, fontSize: 16, color: TEXT, fontWeight: '600' },

    // Test button
    testBtn: {
        marginTop: 32,
        alignSelf: 'center',
        backgroundColor: '#ff6e40',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 12,
    },
    testBtnText: {
        color: 'white',
        fontWeight: '700',
    },
});

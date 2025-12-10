import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    GestureResponderEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as crypto from "expo-crypto";
import { Buffer } from 'buffer';
import { API_URL, storeValue } from './util';

type Mode = 'login' | 'signup';

const GREEN = '#2E7D32';
const GREEN_MID = '#5FA868';
const GRAY_LIGHT = '#E6E6E6';
const TEXT = '#111';

export default function AuthScreen() {
    const [mode, setMode] = useState<Mode>('login');

    // Separate state per tab
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPw, setLoginPw] = useState('');

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPw, setSignupPw] = useState('');
    const [signupPw2, setSignupPw2] = useState('');

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);


    // Response Types
    type BackendSuccess = {
        success: 'success' | true;
        payload: { jwt: string };
        message?: string;
    };

    type BackendFail = {
        success: 'fail' | false | string;
        message?: string;
    };

    type LoginResponse = BackendSuccess | BackendFail;

    // Type Guard
    function isSuccess(resp: LoginResponse): resp is BackendSuccess {
        return resp.success === 'success' || resp.success === true;

    }

    // Fetch with Timeout
    function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), ms);
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
    }

    // Validation helpers
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isLoginEmailValid = useMemo(() => EMAIL_RE.test(loginEmail.trim()), [loginEmail]);
    const isSignupEmailValid = useMemo(() => EMAIL_RE.test(signupEmail.trim()), [signupEmail]);
    const passwordsMatch = useMemo(() => signupPw === signupPw2, [signupPw, signupPw2]);

    const canSubmit = useMemo(() => {
        if (mode === 'login') {
            return !!(loginEmail.trim() && isLoginEmailValid && loginPw.trim());
        }
        return !!(
            signupName.trim() &&
            signupEmail.trim() && isSignupEmailValid &&
            signupPw.trim() &&
            signupPw2.trim() &&
            passwordsMatch
        );
    }, [
        mode,
        loginEmail, loginPw, isLoginEmailValid,
        signupName, signupEmail, isSignupEmailValid, signupPw, signupPw2, passwordsMatch
    ]);

    const onSubmit = async () => {
        if (!canSubmit || loading) return;
            setSubmitError(null);
            setSuccessMsg(null);
        
        if (mode === 'login') {
           try {
            setLoading(true);
            const endpoint = `${API_URL}/login`;
            const res = await fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail.trim().toLowerCase(),
                    password: loginPw,
                }),
            });

            let data: LoginResponse;
            try {
                data = (await res.json()) as LoginResponse;
            } catch {
                throw new Error('Invalid server response.');
            }

            if (!res.ok) {
                throw new Error((data as BackendFail)?.message || 'Login failed.');
            }

            if (!isSuccess(data)) {
                throw new Error(data?.message || 'Login failed.');
            }

            setSubmitError('Login successful. Redirecting...');
            const token = data.payload.jwt;
            await storeValue('jwt', token);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            const msg =
                err?.name === 'AbortError'
                    ? 'Login timed out. Check your connection and try again.'
                    : err?.message || 'Login failed. Please try again.';
            setSubmitError(msg);
        } finally {
            setLoading(false);
        }

        } else {
            // CREATE ACCOUNT
            try {
            setLoading(true);
            const endpoint = `${API_URL}/create-account`;
            const res = await fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                email: signupEmail.trim().toLowerCase(),
                password: signupPw,
                }),
            });

            let data: any = null;
            try { data = await res.json(); } catch {}

            if (!res.ok) {
                const serverMsg =
                (data && (data.message || data.error || data.detail)) ||
                `Signup failed with status ${res.status}`;
                throw new Error(serverMsg);
            }

            if (!(data?.success === 'success' || data?.success === true)) {
                throw new Error(data?.message || 'Signup failed.');
            }

            // Success — ask the user to verify and go to login
            setSubmitError('Account created. Please check your email to verify.');

            } catch (err: any) {
                throw new Error('Signup failed.');
                
            } finally {
                setLoading(false);
            }
        }

    };

    const googleLogin = async () => {
        // Google's OAuth 2.0 endpoint for requesting an access token
        var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

        var redirect = Linking.createURL("google-login");

        var buffer = Buffer.from(crypto.getRandomBytes(16));
        // Parameters to pass to OAuth 2.0 endpoint.
        const params: Record<string, string> = {
            'client_id': '520081347859-d4rrpbh5em9rfqhju73b4mq0jmoiu3f8.apps.googleusercontent.com',
            'redirect_uri': API_URL + '/google-login',
            'response_type': 'id_token',
            'scope': 'openid%20' + 'https://www.googleapis.com/auth/userinfo.email',
            'state': redirect,
            'nonce': buffer.toString('base64')
        };
        var url = oauth2Endpoint;
        // Create url
        for (var p in params) {
            if (url == oauth2Endpoint)
                url += '?';
            else
                url += '&';
            url += p + '=' + params[p];
        }
        
        var result = await WebBrowser.openAuthSessionAsync(url, redirect);

        console.log(result);

        if (result.type == "success")
            router.replace("/(tabs)/home");
    }

    const goToSplash = () => {
        const target: Href = '/';
        router.replace(target);
    };

    const switchToLogin = () => {
        setMode('login');
        // Clear signup fields
        setSignupName(''); setSignupEmail(''); setSignupPw(''); setSignupPw2('');
        setFocusedField(null);
        setSubmitError(null);
        setSuccessMsg(null);
    };

    const switchToSignup = () => {
        setMode('signup');
        // Clear login fields
        setLoginEmail(''); setLoginPw('');
        setFocusedField(null);
        setSubmitError(null);
        setSuccessMsg(null);
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
                <View style={styles.container}>
                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <Pressable style={styles.tab} onPress={switchToLogin} disabled={loading}>
                            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                                Login
                            </Text>
                            <Accent active={mode === 'login'} />
                        </Pressable>

                        <Pressable style={styles.tab} onPress={switchToSignup} disabled={loading}>
                            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                                Create Account
                            </Text>
                            <Accent active={mode === 'signup'} />
                        </Pressable>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {mode === 'login' ? (
                            <>
                                {/* Email (login) */}
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    value={loginEmail}
                                    onChangeText={setLoginEmail}
                                    placeholder="you@example.com"
                                    style={[styles.input, inputBorder('email')]}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#BDBDBD"
                                    editable={!loading}

                                />
                                {loginEmail.length > 0 && !isLoginEmailValid && (
                                    <Text style={styles.errorText}>Enter a valid email address</Text>
                                )}

                                {/* Password (login) */}
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    value={loginPw}
                                    onChangeText={setLoginPw}
                                    placeholder="••••••••"
                                    style={[styles.input, inputBorder('password')]}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                    placeholderTextColor="#BDBDBD"
                                    editable={!loading}

                                />

                                <Pressable onPress={() => router.push("/ForgotPassword")} style={styles.forgotWrap} disabled={loading}>
                                    <Text style={styles.forgot}>Forgot Password</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>

                                {/* Email (signup) */}
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    value={signupEmail}
                                    onChangeText={setSignupEmail}
                                    placeholder="you@example.com"
                                    style={[styles.input, inputBorder('email')]}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#BDBDBD"
                                    editable={!loading}

                                />
                                {signupEmail.length > 0 && !isSignupEmailValid && (
                                    <Text style={styles.errorText}>Enter a valid email address</Text>
                                )}

                                {/* Passwords (signup) */}
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    value={signupPw}
                                    onChangeText={setSignupPw}
                                    placeholder="••••••••"
                                    style={[styles.input, inputBorder('password')]}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                    placeholderTextColor="#BDBDBD"
                                    editable={!loading}

                                />

                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    value={signupPw2}
                                    onChangeText={setSignupPw2}
                                    placeholder="••••••••"
                                    style={[styles.input, inputBorder('confirm')]}
                                    onFocus={() => setFocusedField('confirm')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                    placeholderTextColor="#BDBDBD"
                                    editable={!loading}
                                />
                                {signupPw2.length > 0 && !passwordsMatch && (
                                    <Text style={styles.errorText}>Passwords do not match</Text>
                                )}
                            </>
                        )}

                            {submitError && (
                            <Text
                                style={[
                                styles.errorText,
                                {
                                    marginTop: 4,
                                    color:
                                    submitError.includes('Login successful') ||
                                    submitError.includes('Account created')
                                        ? '#2E7D32' 
                                        : '#D32F2F', 
                                },
                                ]}
                            >
                                {submitError}
                            </Text>
                            )}

                        <Pressable
                            onPress={onSubmit}
                            disabled={!canSubmit || loading}
                            style={[styles.primaryBtn, (!canSubmit || loading) && styles.primaryBtnDisabled]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#1D3B25" />
                            ) : (
                            <Text style={styles.primaryBtnText}>
                                {mode === 'login' ? 'Login' : 'Create Account'}
                            </Text>
                            )}
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
                            icon={<Ionicons name="logo-google" size={18} color="#DB4437" />}
                            label={mode === 'login' ? 'Login With Google' : 'Continue With Google'}
                            onPress={googleLogin}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Socials
function SocialButton({ icon, label, onPress }: { icon: React.ReactNode; label: string, onPress?: (event: GestureResponderEvent) => void }) {
    return (
        <Pressable style={styles.socialBtn} onPress={onPress}>
            <View style={styles.socialIcon}>{icon}</View>
            <Text style={styles.socialText}>{label}</Text>
        </Pressable>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'flex-start',
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    tab: { flex: 1, alignItems: 'center', paddingBottom: 4 },
    tabText: { fontSize: 16, fontWeight: '700', color: '#9E9E9E' },
    tabTextActive: { color: GREEN },
    tabUnderline: {
        marginTop: 8,
        height: 1,
        width: 72,
        backgroundColor: 'transparent',
    },
    tabUnderlineActive: { backgroundColor: GREEN },

    form: { marginTop: 6, gap: 14 },
    label: { fontSize: 14, color: TEXT, fontWeight: '600', marginBottom: 6 },

    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        borderColor: GRAY_LIGHT,
    },

    forgotWrap: { alignSelf: 'flex-end', marginTop: 6 },
    forgot: { color: GREEN_MID, fontWeight: '600' },

    primaryBtn: {
        backgroundColor: '#9ACB9F',
        borderColor: GREEN,
        borderWidth: 1,
        borderRadius: 22,
        paddingVertical: 12,
        width: '85%',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    primaryBtnDisabled: {
        backgroundColor: '#c9cecaff',
        borderColor: 'rgba(0, 0, 0, 0.5)',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },

    dividerRow: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    divider: { flex: 1, height: 1, backgroundColor: GREEN },
    or: { color: '#444', fontWeight: '600' },

    socialList: {
        marginTop: 20,
        gap: 10,
    },

    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: GRAY_LIGHT,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#FFFFFF',
    },
    socialIcon: { width: 26, alignItems: 'center' },
    socialText: { marginLeft: 10, fontSize: 16, color: TEXT, fontWeight: '600' },

    errorText: {
        color: '#D32F2F',
        fontSize: 13,
        fontWeight: '600',
        marginTop: -4,
        marginLeft: 4,
    },

    // Dev Buttons (Can Remove in Final Version)
    // Reminder to adjust spacing bc it's going to look strange with empty space
    devBtns: {
        marginTop: 'auto',
        alignItems: 'center',
        marginBottom: 20,
    },
    devBtn: {
        backgroundColor: '#9ACB9F',
        borderColor: GREEN,
        borderWidth: 1,
        borderRadius: 22,
        paddingVertical: 10,
        paddingHorizontal: 36,
        width: '85%',
        alignItems: 'center',
    },
    devBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

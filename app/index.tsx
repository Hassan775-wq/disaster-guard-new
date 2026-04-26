import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { confirmPasswordReset, sendPasswordResetEmail, signInWithEmailAndPassword, verifyPasswordResetCode } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { auth, db } from '../firebaseConfig';
declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string, options: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaWebLoad?: () => void;
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false);
  const [savePasswordLoading, setSavePasswordLoading] = useState(false);
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetStep, setResetStep] = useState<'send' | 'verify' | 'password'>('send');
  const [oobCode, setOobCode] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [resolvedResetEmail, setResolvedResetEmail] = useState('');
  const [resetUserDocId, setResetUserDocId] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resetStatusMessage, setResetStatusMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [inputError, setInputError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaHeight, setCaptchaHeight] = useState(70);
  const [captchaKey, setCaptchaKey] = useState(() => Math.floor(Math.random() * 1000000));
  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recaptchaSiteKey = '6Ld1fcksAAAAANw1CULERgHMsMEAmcvXnR0F5V94';
  const recaptchaBaseUrl = 'https://disasterevacuationapp.firebaseapp.com';
  const webRecaptchaContainerId = `recaptcha-web-container-${captchaKey}`;
  const nativeCaptchaInjectedJS = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'width=device-width, initial-scale=0.8, maximum-scale=1.0, user-scalable=yes');
      const style = document.createElement('style');
      style.innerHTML = \`
        body { display: flex; justify-content: center; align-items: flex-start; margin: 0; padding: 0; overflow-x: hidden; }
        .rc-anchor-normal { width: 100% !important; }
        .rc-anchor-content { width: 100% !important; }
        #rc-imageselect { transform: scale(0.85); transform-origin: 0 0; }
      \`;
      document.head.appendChild(style);

      const fitChallengeFrame = () => {
        const challengeFrame = document.querySelector('iframe[src*="bframe"]');
        if (!(challengeFrame && challengeFrame instanceof HTMLElement)) return;

        const host = challengeFrame.parentElement;
        if (!(host && host instanceof HTMLElement)) return;

        const viewportWidth = Math.max(300, Math.min(window.innerWidth || 360, document.documentElement.clientWidth || 360));
        const challengeBaseWidth = 390;
        const scale = Math.max(0.74, Math.min(0.90, (viewportWidth - 12) / challengeBaseWidth));

        host.style.left = '50%';
        host.style.right = 'auto';
        host.style.transform = 'translateX(-50%) scale(' + scale + ')';
        host.style.transformOrigin = 'top center';
        host.style.maxWidth = challengeBaseWidth + 'px';

        challengeFrame.style.maxWidth = challengeBaseWidth + 'px';
        challengeFrame.style.transformOrigin = 'top center';
      };

      const observer = new MutationObserver(() => {
        fitChallengeFrame();
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }

      window.addEventListener('resize', fitChallengeFrame);
      fitChallengeFrame();
      setTimeout(fitChallengeFrame, 250);
      setTimeout(fitChallengeFrame, 700);
      true;
    })();
  `;
  const captchaHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        min-height: 78px;
        overflow: hidden;
      }

      html,
      body {
        width: 100%;
      }

      .captcha-shell {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        overflow: hidden;
      }

      .g-recaptcha {
        transform-origin: top center;
      }
    </style>
  </head>
  <body>
    <div class="captcha-shell">
      <div
        class="g-recaptcha"
        data-sitekey="${recaptchaSiteKey}"
        data-size="normal"
        data-theme="light"
        data-callback="onCaptchaSuccess"
        data-expired-callback="onCaptchaExpired"
        data-error-callback="onCaptchaError"
      ></div>
    </div>
    <script>
      function fitCaptcha() {
        var recaptcha = document.querySelector('.g-recaptcha');
        if (!recaptcha) return;

        var baseWidth = 302;
        var viewportWidth = Math.min(window.innerWidth || 360, document.documentElement.clientWidth || 360);
        var availableWidth = Math.max(270, viewportWidth - 16);
        var scale = Math.min(1, availableWidth / baseWidth);

        recaptcha.style.transform = 'scale(' + scale + ')';
        recaptcha.style.margin = '0 auto';
      }

      function notifyOpen() {
        window.ReactNativeWebView.postMessage('captcha-open');
      }

      document.addEventListener('click', notifyOpen, true);
      document.addEventListener('touchstart', notifyOpen, true);

      function onCaptchaSuccess(token) {
        window.ReactNativeWebView.postMessage(token);
        window.ReactNativeWebView.postMessage('captcha-close');
      }
      function onCaptchaExpired() {
        window.ReactNativeWebView.postMessage('captcha-expired');
        window.ReactNativeWebView.postMessage('captcha-close');
      }
      function onCaptchaError() {
        window.ReactNativeWebView.postMessage('captcha-error');
        window.ReactNativeWebView.postMessage('captcha-close');
      }

      window.addEventListener('load', fitCaptcha);
      window.addEventListener('resize', fitCaptcha);
      setTimeout(fitCaptcha, 250);
      setTimeout(fitCaptcha, 800);
    </script>
  </body>
</html>`;

  useFocusEffect(
    useCallback(() => {
      setCaptchaToken('');
      setCaptchaVerified(false);
      setCaptchaHeight(70);
      setCaptchaKey(Math.floor(Math.random() * 1000000));
      return undefined;
    }, [])
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    async function loadIcons() {
    try {
      await Font.loadAsync(Feather.font);
    } catch (e) {
      console.warn("Font loading failed", e);
    }
  }
  loadIcons();
    let renderCheckInterval: ReturnType<typeof setInterval> | null = null;

    const clearRenderCheckInterval = () => {
      if (renderCheckInterval) {
        clearInterval(renderCheckInterval);
        renderCheckInterval = null;
      }
    };

    const renderWebCaptcha = () => {
      if (!(window.grecaptcha && typeof window.grecaptcha.render === 'function')) return false;
      const container = document.getElementById(webRecaptchaContainerId);
      if (!container) return false;
      if (container.childElementCount > 0) return true;

      window.grecaptcha.render(webRecaptchaContainerId, {
        sitekey: recaptchaSiteKey,
        callback: (token: string) => {
          setCaptchaToken(token);
          setCaptchaVerified(true);
        },
        'expired-callback': () => {
          setCaptchaToken('');
          setCaptchaVerified(false);
        },
        'error-callback': () => {
          setCaptchaToken('');
          setCaptchaVerified(false);
        },
      });

      return true;
    };

    const startRenderCheck = () => {
      clearRenderCheckInterval();
      renderCheckInterval = setInterval(() => {
        const rendered = renderWebCaptcha();
        if (rendered) {
          clearRenderCheckInterval();
        }
      }, 500);
    };

    const existingScript = document.querySelector('script[data-recaptcha="true"]') as HTMLScriptElement | null;
    if (existingScript) {
      const rendered = renderWebCaptcha();
      if (!rendered) {
        window.onRecaptchaWebLoad = () => {
          const didRender = renderWebCaptcha();
          if (!didRender) startRenderCheck();
        };
        startRenderCheck();
      }
      return () => {
        clearRenderCheckInterval();
        window.onRecaptchaWebLoad = undefined;
      };
    }

    window.onRecaptchaWebLoad = () => {
      const didRender = renderWebCaptcha();
      if (!didRender) startRenderCheck();
    };

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaWebLoad&render=explicit';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'true');
    script.onload = () => {
      const didRender = renderWebCaptcha();
      if (!didRender) startRenderCheck();
    };
    document.head.appendChild(script);

    return () => {
      clearRenderCheckInterval();
      window.onRecaptchaWebLoad = undefined;
    };
  }, [captchaKey, recaptchaSiteKey, webRecaptchaContainerId]);

  useEffect(() => {
    if (!showEmailPromptModal || resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [showEmailPromptModal, resendSeconds]);

  const handleNativeCaptchaMessage = (event: WebViewMessageEvent) => {
    const token = event.nativeEvent.data;

    if (token === 'captcha-open') {
      setCaptchaHeight(620);
      return;
    }

    if (token === 'captcha-close') {
      setCaptchaHeight(70);
      return;
    }

    if (token === 'captcha-expired') {
      setCaptchaToken('');
      setCaptchaVerified(false);
      setCaptchaHeight(70);
      return;
    }
    if (token === 'captcha-error') {
      setCaptchaToken('');
      setCaptchaVerified(false);
      setCaptchaHeight(70);
      return;
    }
    if (!token) {
      setCaptchaToken('');
      setCaptchaVerified(false);
      setCaptchaHeight(70);
      return;
    }

    setCaptchaToken(token);
    setCaptchaVerified(true);
    setCaptchaHeight(70);
  };

  const validateInput = (value: string) => {
    if (!value) {
      setInputError('Field is required');
      return false;
    }
    const trimmed = value.trim();
    const hasLetters = /[a-zA-Z]/.test(trimmed);

    if (!hasLetters) {
      const phoneRegex = /^[0-9+\-\s]+$/;
      if (!phoneRegex.test(trimmed)) {
        setInputError('Phone contains invalid characters');
        return false;
      }
      const digitsOnly = trimmed.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10) {
        setInputError('Phone number must be at least 10 digits');
        return false;
      }
      setInputError('');
      return true;
    }

    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
    if (!usernameRegex.test(trimmed)) {
      setInputError('Username must start with a letter and contain only letters & numbers');
      return false;
    }
    if (trimmed.length < 3) {
      setInputError('Username must be at least 3 characters');
      return false;
    }
    setInputError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError('Must contain at least 1 uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(value)) {
      setPasswordError('Must contain at least 1 number');
      return false;
    }
    if (!/[!@#$%^&*]/.test(value)) {
      setPasswordError('Must contain at least 1 special character (!@#$%^&*)');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const executeLogin = async (rawInput: string, rawPassword: string) => {
    setLoading(true);
    try {
      let email;
      const trimmed = rawInput.trim();

      if (/^[a-zA-Z]/.test(trimmed)) {
        email = `${trimmed}@disasterguard.app`;
      } else {
        email = `${trimmed.replace(/[^0-9]/g, '')}@disasterguard.app`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, rawPassword);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Invalid username/phone or password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const isInputValid = validateInput(input);
    const isPasswordValid = validatePassword(password);

    if (!isInputValid || !isPasswordValid) return;

    if (!captchaVerified || !captchaToken) {
      return;
    }

    await executeLogin(input, password);
  };

  const validateResetPasswordStrength = (value: string) => {
    if (!value || value.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(value)) return 'Must contain at least 1 uppercase letter.';
    if (!/[0-9]/.test(value)) return 'Must contain at least 1 number.';
    if (!/[!@#$%^&*]/.test(value)) return 'Must contain at least 1 special character (!@#$%^&*).';
    return '';
  };

  const getUserEmailFromDoc = (userData: Record<string, unknown>) => {
    const fields = ['email', 'address', 'realEmail'] as const;
    for (const field of fields) {
      const value = typeof userData[field] === 'string' ? (userData[field] as string).trim().toLowerCase() : '';
      if (value && emailRegex.test(value)) return value;
    }
    return '';
  };

  const resolveResetTarget = async (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { email: '', userDocId: '', error: 'Please enter your registered Username or Phone.' };
    }

    const usersRef = collection(db, 'users');
    const lowered = trimmed.toLowerCase();

    if (emailRegex.test(lowered)) {
      const emailQuery = await getDocs(query(usersRef, where('email', '==', lowered), limit(1)));
      if (!emailQuery.empty) {
        return { email: lowered, userDocId: emailQuery.docs[0].id, error: '' };
      }

      const addressQuery = await getDocs(query(usersRef, where('address', '==', lowered), limit(1)));
      if (!addressQuery.empty) {
        return { email: lowered, userDocId: addressQuery.docs[0].id, error: '' };
      }

      return { email: lowered, userDocId: '', error: '' };
    }

    const digits = trimmed.replace(/[^0-9]/g, '');
    const lookupCandidates = Array.from(new Set([trimmed, digits]));

    for (const candidate of lookupCandidates) {
      const phoneMatch = await getDocs(query(usersRef, where('phone', '==', candidate), limit(1)));
      if (!phoneMatch.empty) {
        const userDoc = phoneMatch.docs[0];
        const email = getUserEmailFromDoc(userDoc.data() as Record<string, unknown>);
        if (!email) {
          return { email: '', userDocId: '', error: "Couldn't find a real email for this account." };
        }
        return { email, userDocId: userDoc.id, error: '' };
      }

      const usernameMatch = await getDocs(query(usersRef, where('username', '==', candidate), limit(1)));
      if (!usernameMatch.empty) {
        const userDoc = usernameMatch.docs[0];
        const email = getUserEmailFromDoc(userDoc.data() as Record<string, unknown>);
        if (!email) {
          return { email: '', userDocId: '', error: "Couldn't find a real email for this account." };
        }
        return { email, userDocId: userDoc.id, error: '' };
      }
    }

    return { email: '', userDocId: '', error: 'This user does not exist in Karachi DisasterGuard records.' };
  };

  const closeResetModal = () => {
    setShowEmailPromptModal(false);
    setResetIdentifier('');
    setOobCode('');
    setVerifiedCode('');
    setResolvedResetEmail('');
    setResetUserDocId('');
    setResetStep('send');
    setResendSeconds(0);
    setResetStatusMessage('');
    setResetError('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const submitPasswordReset = async (identifier: string) => {
    if (resendSeconds > 0 && resetStep !== 'send') return;

    setResetError('');
    setResetLoading(true);
    try {
      const target = await resolveResetTarget(identifier);
      if (target.error || !target.email) {
        setResetError(target.error || "Couldn't find a real email for this account.");
        return;
      }

      await sendPasswordResetEmail(auth, target.email);
      setResolvedResetEmail(target.email);
      setResetUserDocId(target.userDocId);
      setResetStep('verify');
      setResendSeconds(60);
      setResetStatusMessage(`Reset email sent to ${target.email}. Copy the code at the end of the link in your email.`);
      Alert.alert('Notice', 'Trigger sent from localhost. If not received in 2 minutes, verify SMTP settings in Firebase Console.');
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        setResetError('This user does not exist in Karachi DisasterGuard records.');
      } else {
        setResetError(error?.message ?? 'Could not send reset email right now.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    const trimmedCode = oobCode.trim();

    if (!trimmedCode) {
      setResetError('Please enter the reset code from your email link.');
      return;
    }

    if (trimmedCode === 'DEV-999') {
      setVerifiedCode(trimmedCode);
      setResetStep('password');
      setResetStatusMessage('Development bypass accepted. You can now set a new password.');
      setResetError('');
      return;
    }

    setResetError('');
    setVerifyCodeLoading(true);
    try {
      await verifyPasswordResetCode(auth, trimmedCode);
      setVerifiedCode(trimmedCode);
      setResetStep('password');
      setResetStatusMessage('Code verified. Please set your new password.');
    } catch (error: any) {
      if (error?.code === 'auth/invalid-action-code') {
        setResetError('This reset code is invalid or expired. Request a new reset email.');
      } else if (error?.code === 'auth/user-not-found') {
        setResetError('This user does not exist in Karachi DisasterGuard records.');
      } else {
        setResetError(error?.message ?? 'Could not verify reset code.');
      }
    } finally {
      setVerifyCodeLoading(false);
    }
  };

  const handleUpdateFirestorePassword = async (passwordValue: string) => {
    let docId = resetUserDocId;
    if (!docId && resolvedResetEmail) {
      const usersRef = collection(db, 'users');
      const email = resolvedResetEmail.trim().toLowerCase();
      const lookups = [
        query(usersRef, where('email', '==', email), limit(1)),
        query(usersRef, where('address', '==', email), limit(1)),
        query(usersRef, where('realEmail', '==', email), limit(1)),
      ];

      for (const lookup of lookups) {
        const result = await getDocs(lookup);
        if (!result.empty) {
          docId = result.docs[0].id;
          break;
        }
      }
    }

    if (!docId) return false;

    await updateDoc(doc(db, 'users', docId), {
      password: passwordValue,
      passwordUpdatedAt: new Date().toISOString(),
      localTestingUpdate: true,
    });

    if (!resetUserDocId) {
      setResetUserDocId(docId);
    }

    return true;
  };

  const handleConfirmResetInApp = async () => {
    if (!verifiedCode) {
      setResetError('Please verify your reset code first.');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setResetError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    const strengthError = validateResetPasswordStrength(newPassword);
    if (strengthError) {
      setResetError(strengthError);
      return;
    }

    setResetError('');
    setSavePasswordLoading(true);
    let authUpdated = false;
    let authError: any = null;
    let firestoreUpdated = false;

    try {
      await confirmPasswordReset(auth, verifiedCode, newPassword);
      authUpdated = true;
    } catch (error: any) {
      authError = error;
    }

    try {
      firestoreUpdated = await handleUpdateFirestorePassword(newPassword);
    } catch (firestoreError: any) {
      firestoreUpdated = false;
      if (!authUpdated) {
        setResetError(firestoreError?.message ?? 'Could not update password right now.');
      }
    }

    try {
      if (authUpdated && firestoreUpdated) {
        setResetStatusMessage(`Password updated successfully for ${resolvedResetEmail || 'your account'}.`);
        Alert.alert('Success', 'Password reset successful. You can now log in with your new password.');
        closeResetModal();
        return;
      }

      if (!authUpdated && firestoreUpdated) {
        const authCode = authError?.code;
        if (authCode === 'auth/invalid-action-code') {
          setResetError('Auth reset code failed, but local Firestore password was updated for testing.');
        } else if (authCode === 'auth/user-not-found') {
          setResetError('Firebase Auth user not found, but local Firestore password was updated for testing.');
        } else {
          setResetError('Firebase Auth update failed, but local Firestore password was updated for testing.');
        }
        setResetStatusMessage('Local test update completed in Firestore.');
        return;
      }

      if (!authUpdated && !firestoreUpdated) {
        const authCode = authError?.code;
        if (authCode === 'auth/invalid-action-code') {
          setResetError('This reset code is invalid or expired. Request a new reset email.');
        } else if (authCode === 'auth/user-not-found') {
          setResetError('This user does not exist in Karachi DisasterGuard records.');
        } else {
          setResetError(authError?.message ?? 'Could not update password right now.');
        }
        return;
      }

      setResetStatusMessage(`Password updated successfully for ${resolvedResetEmail || 'your account'}.`);
      Alert.alert('Success', 'Password reset successful. You can now log in with your new password.');
      closeResetModal();
    } finally {
      setSavePasswordLoading(false);
    }
  };

  const isUpdatePasswordEnabled =
    newPassword.length >= 6 &&
    confirmNewPassword.length >= 6 &&
    newPassword === confirmNewPassword;

  const getUpdateButtonLabel = () => {
    if (savePasswordLoading) return 'Updating...';
    if (!newPassword || !confirmNewPassword) return 'Update Password';
    if (newPassword.length < 6 || confirmNewPassword.length < 6) return 'Min 6 characters required';
    if (newPassword !== confirmNewPassword) return 'Passwords do not match';
    return 'Update Password';
  };

  const handleForgotPassword = async () => {
    if (resetLoading) return;

    setResetIdentifier(input.trim());
    setResetStep('send');
    setOobCode('');
    setVerifiedCode('');
    setResolvedResetEmail('');
    setResetUserDocId('');
    setResendSeconds(0);
    setResetStatusMessage('');
    setResetError('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowEmailPromptModal(true);
  };

  return (
    <LinearGradient colors={['#FF4500', '#FF8C00']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 10, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >

        <View style={[styles.logoArea, { paddingTop: insets.top }]}>
          <View style={styles.logoHeaderRow}>
            <View style={styles.titleRow}>
              <Text style={styles.titleDisaster}>Disaster</Text>
              <Text style={styles.titleGuard}>Guard</Text>
            </View>
          </View>
          {/* UPDATED: Subtitle changed to Disaster Evacuation App */}
          <Text style={styles.subtitle}>Disaster Evacuation App</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome Back</Text>

          {/* INPUT */}
          <Text style={styles.label}>Username or Phone</Text>
          <TextInput
            style={[styles.input, inputError ? styles.inputError : null]}
            placeholder="Enter username or phone"
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={(text) => {
              setInput(text);
              if (inputError) validateInput(text);
            }}
          />
          {inputError ? <Text style={styles.errorText}>⚠ {inputError}</Text> : null}

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, passwordError ? styles.inputError : null]}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) validatePassword(text);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>⚠ {passwordError}</Text> : null}

          <View style={styles.captchaSection}>
            <Text style={styles.captchaLabel}>Complete reCAPTCHA verification</Text>

            {Platform.OS === 'web' ? (
              <View key={`captcha-web-${captchaKey}`} style={styles.captchaWebContainer}>
                <View nativeID={webRecaptchaContainerId} style={styles.webCaptchaMount} />
              </View>
            ) : (
              <View style={styles.captchaNativeContainer}>
                <View style={styles.captchaNativeInnerContainer}>
                  <View style={styles.captchaWebViewWrapper}>
                    <WebView
                      key={`captcha-native-${captchaKey}`}
                      originWhitelist={['*']}
                      source={{ html: captchaHtml, baseUrl: recaptchaBaseUrl }}
                      injectedJavaScript={nativeCaptchaInjectedJS}
                      onMessage={handleNativeCaptchaMessage}
                      javaScriptEnabled
                      domStorageEnabled
                      scalesPageToFit
                      style={[styles.captchaWebView, { height: captchaHeight }]}
                      scrollEnabled={false}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.forgotWrap} onPress={handleForgotPassword} disabled={resetLoading}>
            {resetLoading ? (
              <View style={styles.forgotLoadingRow}>
                <ActivityIndicator size="small" color="#CC2200" />
                <Text style={styles.forgot}> Sending reset email...</Text>
              </View>
            ) : (
              <Text style={styles.forgot}>Forgot Password?</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading || !captchaVerified}
          >
            <Text style={styles.signInText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* NEW DEMO USER BUTTON */}
          <TouchableOpacity 
            style={styles.demoUserBtn} 
            onPress={() => router.push('/user')}
          >
            <Text style={styles.demoText}>Demo User Login</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/register')}>
            <Text style={styles.createText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emergencyFooterWrap}>
          <View style={styles.bottomSafetyBlock}>
            <View style={styles.emergency}>
              <Text style={styles.emergencyLabel}>In case of emergency, dial:</Text>
              <Text style={styles.emergencyNumbers}>Rescue: 115 | Police: 15 | Fire: 16 | Ambulance: 1122</Text>
            </View>
          </View>
        </View>

      </ScrollView>
  </KeyboardAvoidingView>

      <Modal visible={showEmailPromptModal} transparent animationType="fade" onRequestClose={closeResetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              {resetStep === 'send'
                ? 'Step 1: Enter your registered Username or Phone.'
                : resetStep === 'verify'
                  ? 'Step 2: Paste the reset code (oobCode) from the email link.'
                  : 'Step 3: Set your new password.'}
            </Text>

            {resetStep === 'send' ? (
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Username or Phone"
                placeholderTextColor="#9ca3af"
                keyboardType="default"
                value={resetIdentifier}
                onChangeText={setResetIdentifier}
              />
            ) : null}

            {resetStep === 'verify' ? (
              <>
                <Text style={styles.modalInfoText}>Copy the code at the end of the link in your email. Use DEV-999 to bypass verification in development.</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Reset Code from Email (oobCode)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={oobCode}
                  onChangeText={setOobCode}
                />
              </>
            ) : null}

            {resetStep === 'password' ? (
              <View style={styles.modalInlineResetSection}>
                <Text style={styles.modalSectionTitle}>Set New Password</Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />

                <TouchableOpacity
                  style={[styles.modalUpdateBtn, (!isUpdatePasswordEnabled || savePasswordLoading) && { opacity: 0.7 }]}
                  onPress={() => void handleConfirmResetInApp()}
                  disabled={savePasswordLoading || !isUpdatePasswordEnabled}
                >
                  {savePasswordLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalUpdateText}>{getUpdateButtonLabel()}</Text>}
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeResetModal} disabled={resetLoading || verifyCodeLoading || savePasswordLoading}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              {resetStep === 'send' ? (
                <TouchableOpacity
                  style={[styles.modalSendBtn, resetLoading && { opacity: 0.7 }]}
                  onPress={() => void submitPasswordReset(resetIdentifier)}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <View style={styles.modalLoadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.modalSendText}> Sending...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalSendText}>Send Email</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {resetStep === 'verify' ? (
                <View style={styles.modalCodeActions}>
                  <TouchableOpacity
                    style={[styles.modalResendBtn, (resetLoading || resendSeconds > 0) && { opacity: 0.7 }]}
                    onPress={() => void submitPasswordReset(resetIdentifier)}
                    disabled={resetLoading || resendSeconds > 0}
                  >
                    <Text style={styles.modalResendText}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend Email'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSendBtn, verifyCodeLoading && { opacity: 0.7 }]}
                    onPress={() => void handleVerifyResetCode()}
                    disabled={verifyCodeLoading}
                  >
                    {verifyCodeLoading ? (
                      <View style={styles.modalLoadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.modalSendText}> Verifying...</Text>
                      </View>
                    ) : (
                      <Text style={styles.modalSendText}>Verify Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardWrap: { flex: 1 },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  logoArea: { alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: 10, backgroundColor: 'transparent' },
  logoHeaderRow: { flexDirection: 'column', alignItems: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  titleDisaster: { fontSize: 32, fontWeight: '900', color: '#000000' },
  titleGuard: { fontSize: 32, fontWeight: '900', color: '#1565C0' },
  subtitle: { color: '#1565C0', fontSize: 13, letterSpacing: 1, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 },
  welcome: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#111' },
  label: { fontSize: 13, color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 4, color: '#333' },
  inputError: { borderColor: '#CC2200', borderWidth: 1.5 },
  errorText: { color: '#CC2200', fontSize: 12, marginBottom: 10, marginTop: 2 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 4 },
  captchaSection: { marginTop: 4, marginBottom: 12 },
  captchaLabel: { fontSize: 13, color: '#333', marginBottom: 6, fontWeight: '600' },
  captchaNativeContainer: { width: '100%', alignSelf: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden', backgroundColor: '#fff' },
  captchaNativeInnerContainer: { width: '100%', alignSelf: 'center', overflow: 'hidden' },
  captchaWebViewWrapper: { width: '100%', alignSelf: 'center', overflow: 'hidden' },
  captchaWebView: { width: '100%', alignSelf: 'center', backgroundColor: '#fff' },
  captchaWebContainer: { minHeight: 78, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingVertical: 4, overflow: 'hidden' },
  webCaptchaMount: { width: '100%', height: 78, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  eyeIcon: { fontSize: 18, padding: 4 },
  forgotWrap: { alignItems: 'flex-end', marginBottom: 16, marginTop: 4 },
  forgotLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  forgot: { color: '#CC2200', fontSize: 13, fontWeight: '500' },
  signInBtn: { backgroundColor: '#CC2200', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  signInText: { color: 'white', fontWeight: '700', fontSize: 16 },
  demoUserBtn: { backgroundColor: '#2255CC', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  demoText: { color: 'white', fontWeight: '700', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { fontSize: 12, color: '#aaa' },
  createBtn: { borderWidth: 1.5, borderColor: '#CC2200', borderRadius: 8, padding: 13, alignItems: 'center' },
  createText: { color: '#CC2200', fontWeight: '600', fontSize: 15 },
  emergencyFooterWrap: { alignSelf: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  bottomSafetyBlock: { width: '100%', paddingBottom: 40, marginBottom: 20 },
  emergency: { alignItems: 'center', marginTop: 20 },
  emergencyLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  emergencyNumbers: { color: 'white', fontWeight: '700', fontSize: 13, marginTop: 8, textAlign: 'center', width: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#4b5563', marginBottom: 12 },
  modalInfoText: { color: '#4b5563', fontSize: 12, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 10 },
  modalSuccessText: { color: '#166534', fontSize: 13, marginBottom: 10 },
  modalErrorText: { color: '#CC2200', fontSize: 12, marginBottom: 10 },
  modalInlineResetSection: { marginTop: 4, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 },
  modalSectionTitle: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 10 },
  otpRecaptchaHidden: { width: 1, height: 1, opacity: 0 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  modalCodeActions: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#f3f4f6' },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalSendBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#CC2200', minWidth: 90, alignItems: 'center' },
  modalResendBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#f3f4f6', minWidth: 110, alignItems: 'center' },
  modalResendText: { color: '#374151', fontWeight: '600' },
  modalLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  modalSendText: { color: '#ffffff', fontWeight: '700' },
  modalUpdateBtn: { backgroundColor: '#1565C0', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 2 },
  modalUpdateText: { color: '#ffffff', fontWeight: '700' },
});
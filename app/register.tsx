import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nameError, setNameError] = useState('');
  const [inputError, setInputError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError('Full name is required');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Full name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
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

  const validateAddress = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setAddressError('Address is required');
      return false;
    }
    if (trimmed.length < 8) {
      setAddressError('Address must be at least 8 characters');
      return false;
    }
    setAddressError('');
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

  const validateConfirmPassword = (passwordValue: string, confirmValue: string) => {
    if (!confirmValue) {
      setConfirmError('Confirm password is required');
      return false;
    }
    if (passwordValue !== confirmValue) {
      setConfirmError('Passwords do not match');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const getResetErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This username/phone is already registered.';
      case 'auth/invalid-email':
        return 'Invalid username/phone format.';
      case 'auth/weak-password':
        return 'Password is too weak. Use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again later.';
      default:
        return 'Registration failed. Please try again.';
    }
  };

  const handleRegister = async () => {
    const isNameValid = validateName(name);
    const isInputValid = validateInput(input);
    const isAddressValid = validateAddress(address);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(password, confirm);

    if (!isNameValid || !isInputValid || !isAddressValid || !isPasswordValid || !isConfirmValid) return;

    setLoading(true);
    try {
      const trimmedInput = input.trim();
      const isUsername = /^[a-zA-Z]/.test(trimmedInput);
      const normalizedInput = isUsername ? trimmedInput : trimmedInput.replace(/[^0-9]/g, '');
      const email = `${normalizedInput}@disasterguard.app`;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name.trim(),
        phoneOrUsername: trimmedInput,
        address: address.trim(),
        role: 'user',
        status: 'Safe',
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Account created successfully!');
      router.push('/');
    } catch (error: any) {
      Alert.alert('Registration Failed', getResetErrorMessage(error?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FF4500', '#FF8C00']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.logoArea}>
          <Text style={styles.brandLine}>
            <Text style={styles.brandDisaster}>Disaster</Text>
            <Text style={styles.brandGuard}>Guard</Text>
          </Text>
          <Text style={styles.subtitle}>Disaster Management System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create Account</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="Enter your full name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) validateName(text);
            }}
          />
          {nameError ? <Text style={styles.errorText}>⚠ {nameError}</Text> : null}

          <Text style={styles.label}>Username or Phone</Text>
          <TextInput
            style={[styles.input, inputError ? styles.inputError : null]}
            placeholder="Enter username or phone"
            placeholderTextColor="#aaa"
            keyboardType="default"
            value={input}
            onChangeText={(text) => {
              setInput(text);
              if (inputError) validateInput(text);
            }}
          />
          {inputError ? <Text style={styles.errorText}>⚠ {inputError}</Text> : null}

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, addressError ? styles.inputError : null]}
            placeholder="e.g., Block 5, Clifton, Karachi"
            placeholderTextColor="#aaa"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (addressError) validateAddress(text);
            }}
          />
          {addressError ? <Text style={styles.errorText}>⚠ {addressError}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, passwordError ? styles.inputError : null]}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
              placeholder="Create a password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) validatePassword(text);
                if (confirm) validateConfirmPassword(text, confirm);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>⚠ {passwordError}</Text> : null}

          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.passwordRow, confirmError ? styles.inputError : null]}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
              placeholder="Confirm your password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={(text) => {
                setConfirm(text);
                if (confirmError) validateConfirmPassword(password, text);
              }}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {confirmError ? <Text style={styles.errorText}>⚠ {confirmError}</Text> : null}

          <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.createText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/')}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emergency}>
          <Text style={styles.emergencyLabel}>In case of emergency, dial:</Text>
          <Text style={styles.emergencyNumbers}>
            Rescue: 115 | Police: 15 | Fire: 16 | Ambulance: 1122
          </Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', padding: 24, paddingTop: 60 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  brandLine: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  brandDisaster: { color: '#000' },
  brandGuard: { color: '#007BFF' },
  subtitle: { color: 'white', fontSize: 13, letterSpacing: 1, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#111' },
  label: { fontSize: 13, color: '#555', marginBottom: 6 },
  inputError: { borderColor: '#D32F2F' },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: -10, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, color: '#333' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  eyeIcon: { fontSize: 18, padding: 4 },
  createBtn: { backgroundColor: '#CC2200', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  createText: { color: 'white', fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { fontSize: 12, color: '#aaa' },
  signInBtn: { borderWidth: 1.5, borderColor: '#CC2200', borderRadius: 8, padding: 13, alignItems: 'center' },
  signInText: { color: '#CC2200', fontWeight: '600', fontSize: 15 },
  emergency: { alignItems: 'center', marginTop: 20 },
  emergencyLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  emergencyNumbers: { color: 'white', fontWeight: '600', fontSize: 13, marginTop: 4 },
});
// This is my Register.jsx file
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../../auth/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Register = ({ onRegister, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Name is required.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Validation Error', 'Email is required.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Validation Error', 'Phone number is required.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Validation Error', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, {
                displayName: name,
            });

            // Save user data to Firestore 'users' collection
            await setDoc(doc(db, 'users', user.uid), {
                displayName: name.trim(),
                email: email.toLowerCase().trim(),
                isAdmin: false,
                phone: phone.trim()
            });

            Alert.alert('Success', 'Account created successfully');
            onRegister && onRegister(email);
        } catch (error) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Register</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, loading && { backgroundColor: '#aaa' }]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={onBackToLogin} disabled={loading}>
                <Text>Already have an account? Log In</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff3f8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        color: '#000',
    },
    input: {
        width: '100%',
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E96E6E',
    },
    button: {
        width: '100%',
        height: 48,
        backgroundColor: '#E96E6E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        color: '#000',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

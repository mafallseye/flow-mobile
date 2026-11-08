import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme';
import { GradientButton, Logo } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translateError(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Veuillez d’abord confirmer votre e-mail.';
  if (msg.includes('Network request failed')) return 'Pas de connexion internet.';
  return msg || 'Une erreur est survenue.';
}

export default function AuthScreen() {
  const { colors, toggle } = useTheme();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const isSignup = mode === 'signup';

  async function submit() {
    setError('');
    setInfo('');
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setError('Adresse e-mail invalide.');
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;
        if (!data.session) {
          setInfo('Compte créé ! Confirmez votre e-mail via le lien reçu, puis connectez-vous ici.');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(translateError(err?.message));
    } finally {
      setBusy(false);
    }
  }

  const inputBox = (name) => [
    styles.inputBox,
    { backgroundColor: colors.surface, borderColor: focused === name ? colors.primary : colors.border },
  ];
  const iconColor = (name) => (focused === name ? colors.primary : colors.text3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Halo décoratif */}
      <LinearGradient colors={[colors.grad[0] + '33', 'transparent']} style={styles.halo} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable onPress={toggle} style={styles.themeBtn} hitSlop={10} accessibilityLabel="Changer de thème">
              {colors.mode === 'dark' ? <Sun size={22} color={colors.text2} /> : <Moon size={22} color={colors.text2} />}
            </Pressable>

            <Logo size={60} />
            <Text style={[styles.title, { color: colors.text }]}>{isSignup ? 'Créer un compte' : 'Bon retour 👋'}</Text>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              {isSignup ? 'Quelques secondes suffisent.' : 'Connectez-vous pour retrouver vos tâches.'}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
            <View style={inputBox('email')}>
              <Mail size={19} color={iconColor('email')} />
              <TextInput
                style={[styles.input, { color: colors.text }]} placeholder="vous@exemple.com" placeholderTextColor={colors.text3}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                autoComplete="email" textContentType="emailAddress" returnKeyType="next"
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
            <View style={inputBox('pwd')}>
              <Lock size={19} color={iconColor('pwd')} />
              <TextInput
                style={[styles.input, { color: colors.text }]} placeholder="8 caractères minimum" placeholderTextColor={colors.text3}
                value={password} onChangeText={setPassword} secureTextEntry={!showPwd} autoCapitalize="none"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                textContentType={isSignup ? 'newPassword' : 'password'} returnKeyType="go" onSubmitEditing={submit}
                onFocus={() => setFocused('pwd')} onBlur={() => setFocused(null)}
              />
              <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={10}
                accessibilityLabel={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {showPwd ? <EyeOff size={19} color={colors.text3} /> : <Eye size={19} color={colors.text3} />}
              </Pressable>
            </View>

            {!!error && (
              <Text style={[styles.alert, { backgroundColor: colors.dangerSoft, color: colors.danger }]}>{error}</Text>
            )}
            {!!info && <Text style={[styles.alert, { backgroundColor: colors.okSoft, color: colors.ok }]}>{info}</Text>}

            <GradientButton
              style={{ marginTop: 8 }}
              disabled={busy}
              onPress={submit}
              title={busy ? null : isSignup ? 'Créer mon compte' : 'Se connecter'}
              icon={busy ? <ActivityIndicator color="#fff" /> : <ArrowRight size={19} color="#fff" />}
            />

            <View style={styles.switchRow}>
              <Text style={{ color: colors.text2 }}>{isSignup ? 'Déjà inscrit ?' : 'Pas encore de compte ?'} </Text>
              <Pressable onPress={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); setInfo(''); }} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{isSignup ? 'Se connecter' : 'Créer un compte'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 6 },
  themeBtn: { position: 'absolute', top: 8, right: 16, padding: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 20 },
  subtitle: { fontSize: 16, marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  alert: { marginTop: 10, padding: 12, borderRadius: 12, fontSize: 14, overflow: 'hidden' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' },
});

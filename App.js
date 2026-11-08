import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/components/Toast';
import AuthScreen from './src/components/AuthScreen';
import HomeScreen from './src/components/HomeScreen';

function Root() {
  const { colors } = useTheme();
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={colors.mode === 'dark' ? 'light' : 'dark'} />
      {!ready ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : session ? (
        <HomeScreen key={session.user.id} user={session.user} />
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

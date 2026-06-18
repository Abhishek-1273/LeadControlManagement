// App.tsx

import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';  // ← BaseToast add karo agar use kar rahe ho
import { View, Text } from 'react-native';          // ← custom toast ke liye
import { Ionicons } from '@expo/vector-icons';       // ← custom toast ke liye
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60,
    },
  },
});

// ← Yahan define karo
const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={{
      backgroundColor: '#2cc18a',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      width: '85%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      elevation: 5,
    }}>
      <Ionicons name="checkmark-circle" size={20} color="white" />
      <View>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>{text1}</Text>
        {text2 ? <Text style={{ color: 'white', fontSize: 11, opacity: 0.9 }}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={{
      backgroundColor: '#EF4444',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      width: '85%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      elevation: 5,
    }}>
      <Ionicons name="close-circle" size={20} color="white" />
      <View>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>{text1}</Text>
        {text2 ? <Text style={{ color: 'white', fontSize: 11, opacity: 0.9 }}>{text2}</Text> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={{
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      width: '85%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      elevation: 5,
    }}>
      <Ionicons name="information-circle" size={20} color="white" />
      <View>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>{text1}</Text>
        {text2 ? <Text style={{ color: 'white', fontSize: 11, opacity: 0.9 }}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <StatusBar style="auto" backgroundColor={colors.white} />
            <AppNavigator />
            <Toast 
              config={toastConfig}   // ← config pass karo
              position="bottom" 
              bottomOffset={80} 
            />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
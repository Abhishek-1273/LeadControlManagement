import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React from 'react';
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
  const navigationRef = React.useRef<any>(null);

  React.useEffect(() => {
    // ── Notification handler — app open ho tab bhi alert dikhao
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,    
        shouldPlaySound: true,      
        shouldSetBadge: true,     
        shouldShowBanner: true,    
        shouldShowList: true,       
      }),
    });

    // App band ho aur notification tap karo → screen pe navigate karo
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen && navigationRef.current?.isReady()) {
        navigationRef.current.navigate(screen);
      }
    });

    return () => responseSub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <StatusBar style="auto" backgroundColor={colors.white} />
            <AppNavigator navigationRef={navigationRef} />
            <Toast
              config={toastConfig}
              position="bottom"
              bottomOffset={80}
            />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
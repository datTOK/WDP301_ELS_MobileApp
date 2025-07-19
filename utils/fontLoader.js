import * as Font from 'expo-font';

export const loadFonts = async () => {
  try {
    await Font.loadAsync({
      'Mulish-ExtraLight': require('../assets/fonts/Mulish-ExtraLight.ttf'),
      'Mulish-Light': require('../assets/fonts/Mulish-Light.ttf'),
      'Mulish-Regular': require('../assets/fonts/Mulish-Regular.ttf'),
      'Mulish-Medium': require('../assets/fonts/Mulish-Medium.ttf'),
      'Mulish-SemiBold': require('../assets/fonts/Mulish-SemiBold.ttf'),
      'Mulish-Bold': require('../assets/fonts/Mulish-Bold.ttf'),
      'Mulish-ExtraBold': require('../assets/fonts/Mulish-ExtraBold.ttf'),
      'Mulish-Black': require('../assets/fonts/Mulish-Black.ttf'),
    });
    console.log('✅ Mulish fonts loaded successfully');
  } catch (error) {
    console.error('❌ Error loading Mulish fonts:', error);
    throw error;
  }
}; 
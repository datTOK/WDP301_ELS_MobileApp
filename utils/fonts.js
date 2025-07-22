import { Platform } from 'react-native';

// Font family definitions using actual Mulish TTF files
export const fonts = {
  mulish: {
    extraLight: 'Mulish-ExtraLight',
    light: 'Mulish-Light',
    regular: 'Mulish-Regular',
    medium: 'Mulish-Medium',
    semiBold: 'Mulish-SemiBold',
    bold: 'Mulish-Bold',
    extraBold: 'Mulish-ExtraBold',
    black: 'Mulish-Black',
  },
};

export const fontWeights = {
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
};

// Default font family
export const defaultFontFamily = fonts.mulish.regular;

// Weight mapping for converting fontWeight to fontFamily
export const weightMap = {
  '200': 'extraLight',
  '300': 'light',
  '400': 'regular',
  '500': 'medium',
  '600': 'semiBold',
  '700': 'bold',
  '800': 'extraBold',
  '900': 'black',
  'normal': 'regular',
  'bold': 'bold',
};

// Helper function to get font style with weight
export const getFontStyle = (weight = 'regular') => {
  return {
    fontFamily: fonts.mulish[weight] || fonts.mulish.regular,
  };
};

// Helper function to get font family
export const getFontFamily = (weight = 'regular') => {
  return fonts.mulish[weight] || fonts.mulish.regular;
};

// Helper function to create text style with proper font handling
export const createTextStyle = (weight = 'regular', additionalStyles = {}) => {
  return {
    fontFamily: fonts.mulish[weight] || fonts.mulish.regular,
    ...additionalStyles,
  };
};

// Helper function to merge styles while preserving font family
export const mergeTextStyles = (baseStyle, additionalStyle) => {
  // If additionalStyle has fontWeight, convert it to fontFamily
  if (additionalStyle?.fontWeight) {
    const weight = weightMap[additionalStyle.fontWeight];
    if (weight) {
      return {
        ...baseStyle,
        ...additionalStyle,
        fontFamily: fonts.mulish[weight],
        fontWeight: undefined, // Remove fontWeight to prevent conflicts
      };
    }
  }
  
  return {
    ...baseStyle,
    ...additionalStyle,
  };
};

// CRITICAL: Function to safely convert any style object with fontWeight to use fontFamily
export const convertFontWeightToFontFamily = (style) => {
  if (!style) return {};
  
  // Handle array of styles
  if (Array.isArray(style)) {
    return style.map(convertFontWeightToFontFamily);
  }
  
  const { fontWeight, ...otherStyles } = style;
  
  if (fontWeight) {
    const weight = weightMap[fontWeight];
    if (weight) {
      return {
        ...otherStyles,
        fontFamily: fonts.mulish[weight],
      };
    }
  }
  
  return style;
};

// Function to create a safe style object that won't conflict with fontFamily
export const createSafeStyle = (baseStyle = {}, additionalStyle = {}) => {
  const convertedAdditional = convertFontWeightToFontFamily(additionalStyle);
  return {
    ...baseStyle,
    ...convertedAdditional,
  };
};

// Function to apply Mulish font to any style object
export const applyMulishFont = (style, weight = 'regular') => {
  const convertedStyle = convertFontWeightToFontFamily(style);
  return {
    ...convertedStyle,
    fontFamily: fonts.mulish[weight] || fonts.mulish.regular,
  };
}; 
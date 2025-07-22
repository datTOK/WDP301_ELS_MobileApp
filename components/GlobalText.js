import React from 'react';
import { Text as RNText } from 'react-native';
import { fonts, convertFontWeightToFontFamily, applyMulishFont } from '../utils/fonts';

const GlobalText = ({ 
  children, 
  style, 
  weight = 'regular',
  variant,
  ...props 
}) => {
  // Convert any fontWeight to fontFamily to prevent conflicts
  const processedStyle = convertFontWeightToFontFamily(style);

  // Base style with the specified weight
  const baseStyle = {
    fontFamily: fonts.mulish[weight] || fonts.mulish.regular,
  };

  // Apply variant-specific styling if provided
  let variantStyle = {};
  if (variant) {
    switch (variant) {
      case 'title':
        variantStyle = applyMulishFont({ fontSize: 24 }, 'bold');
        break;
      case 'titleLarge':
        variantStyle = applyMulishFont({ fontSize: 28 }, 'bold');
        break;
      case 'subtitle':
        variantStyle = applyMulishFont({ fontSize: 18 }, 'semiBold');
        break;
      case 'body':
        variantStyle = applyMulishFont({ fontSize: 16 }, 'regular');
        break;
      case 'bodySmall':
        variantStyle = applyMulishFont({ fontSize: 14 }, 'regular');
        break;
      case 'caption':
        variantStyle = applyMulishFont({ fontSize: 12 }, 'regular');
        break;
      case 'button':
        variantStyle = applyMulishFont({ fontSize: 16 }, 'semiBold');
        break;
      case 'label':
        variantStyle = applyMulishFont({ fontSize: 14 }, 'medium');
        break;
      case 'link':
        variantStyle = applyMulishFont({ fontSize: 16 }, 'medium');
        break;
      default:
        break;
    }
  }

  return (
    <RNText
      style={[baseStyle, variantStyle, processedStyle]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default GlobalText; 
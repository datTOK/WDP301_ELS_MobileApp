import React from 'react';
import { Text as RNText } from 'react-native';
import { fonts, convertFontWeightToFontFamily } from '../utils/fonts';

const SafeText = ({ 
  children, 
  style, 
  weight = 'regular',
  ...props 
}) => {
  // Convert any fontWeight to fontFamily to prevent conflicts
  const processedStyle = convertFontWeightToFontFamily(style);

  // Base style with the specified weight
  const baseStyle = {
    fontFamily: fonts.mulish[weight] || fonts.mulish.regular,
  };

  return (
    <RNText
      style={[baseStyle, processedStyle]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default SafeText; 
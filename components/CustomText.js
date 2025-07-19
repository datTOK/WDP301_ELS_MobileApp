import React from 'react';
import { Text as RNText } from 'react-native';
import { globalStyles } from '../utils/globalStyles';

const CustomText = ({ 
  children, 
  style, 
  variant = 'text', 
  weight = 'regular',
  ...props 
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'title':
        return globalStyles.title;
      case 'titleLarge':
        return globalStyles.titleLarge;
      case 'subtitle':
        return globalStyles.subtitle;
      case 'caption':
        return globalStyles.caption;
      case 'button':
        return globalStyles.button;
      case 'small':
        return globalStyles.textSmall;
      case 'large':
        return globalStyles.textLarge;
      case 'bold':
        return globalStyles.textBold;
      case 'semiBold':
        return globalStyles.textSemiBold;
      case 'medium':
        return globalStyles.textMedium;
      case 'light':
        return globalStyles.textLight;
      case 'extraLight':
        return globalStyles.textExtraLight;
      case 'extraBold':
        return globalStyles.textExtraBold;
      case 'black':
        return globalStyles.textBlack;
      case 'heading1':
        return globalStyles.heading1;
      case 'heading2':
        return globalStyles.heading2;
      case 'heading3':
        return globalStyles.heading3;
      case 'heading4':
        return globalStyles.heading4;
      case 'body':
        return globalStyles.body;
      case 'bodySmall':
        return globalStyles.bodySmall;
      case 'label':
        return globalStyles.label;
      case 'link':
        return globalStyles.link;
      default:
        return globalStyles.text;
    }
  };

  const getWeightStyle = () => {
    switch (weight) {
      case 'bold':
        return globalStyles.textBold;
      case 'semiBold':
        return globalStyles.textSemiBold;
      case 'medium':
        return globalStyles.textMedium;
      case 'light':
        return globalStyles.textLight;
      case 'extraLight':
        return globalStyles.textExtraLight;
      case 'extraBold':
        return globalStyles.textExtraBold;
      case 'black':
        return globalStyles.textBlack;
      default:
        return {};
    }
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        getWeightStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default CustomText; 
import { StyleSheet } from 'react-native';
import { fonts, convertFontWeightToFontFamily } from './fonts';

// ELS Website-inspired design system
export const createGlobalStyles = (theme) => StyleSheet.create({
  // Layout & Container Styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Card & Surface Styles (matching ELS website)
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardNoPadding: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Header & Navigation Styles
  header: {
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  
  // Typography Styles
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  heading: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  bodyText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: 24,
  },
  
  caption: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  
  // Button Styles (matching ELS website exactly)
  button: {
    backgroundColor: theme.colors.buttonBackground,
    borderRadius: theme.borderRadius.md, // 5px like web
    paddingVertical: theme.spacing.sm + 2, // Slightly more padding for mobile
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 130, // Matching web's min-width
  },
  
  buttonText: {
    color: theme.colors.buttonText, // Black text on blue buttons
    fontSize: theme.typography.fontSize.sm, // 13px like web
    fontFamily: theme.typography.fontFamily.medium,
  },
  
  // Secondary button (gray button like web)
  buttonSecondary: {
    backgroundColor: theme.colors.buttonSecondary || theme.colors.buttonDisabled,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 130,
  },
  
  buttonSecondaryText: {
    color: theme.colors.buttonSecondaryText || theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 130,
  },
  
  buttonOutlineText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  
  buttonDisabled: {
    backgroundColor: theme.colors.buttonDisabled,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 130,
  },
  
  buttonDisabledText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  
  // Input Styles (matching ELS website exactly)
  input: {
    backgroundColor: theme.colors.surfaceBackground, // #2D2D2D for dark mode
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Bottom border like web
    borderBottomWidth: 2, // Thicker bottom border like web
    borderBottomColor: theme.colors.textMuted, // #999999 like web
    borderRadius: theme.borderRadius.md, // 5px like web
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm + 4, // 12px like web
    fontSize: theme.typography.fontSize.sm, // 13px like web
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    minHeight: 44,
    minWidth: 280, // Matching web's min-width
  },
  
  inputFocused: {
    backgroundColor: theme.colors.background === '#202020' ? '#1F1F1F' : theme.colors.surfaceBackground, // Darker on focus like web
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary, // Blue border on focus
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm + 4,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    minHeight: 44,
    minWidth: 280,
  },
  
  // Status & Feedback Styles
  successContainer: {
    backgroundColor: theme.colors.success + '20',
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  
  warningContainer: {
    backgroundColor: theme.colors.warning + '20',
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  
  infoContainer: {
    backgroundColor: theme.colors.info + '20',
    borderWidth: 1,
    borderColor: theme.colors.info,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  
  // List & Item Styles
  listItem: {
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  
  listItemLast: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  
  // Divider & Separator Styles
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderColor,
    marginVertical: theme.spacing.sm,
  },
  
  // Helper function to create safe text style (prevents fontWeight conflicts)
  safeText: (additionalStyles = {}) => {
    const { fontWeight, ...otherStyles } = additionalStyles;
    
    // If fontWeight is provided, convert it to the appropriate fontFamily
    if (fontWeight) {
      const weightMap = {
        'normal': 'Mulish-Regular',
        '400': 'Mulish-Regular',
        'medium': 'Mulish-Medium',
        '500': 'Mulish-Medium',
        'semibold': 'Mulish-SemiBold',
        '600': 'Mulish-SemiBold',
        'bold': 'Mulish-Bold',
        '700': 'Mulish-Bold',
      };
      
      const weight = weightMap[fontWeight];
      if (weight) {
        return {
          fontFamily: weight,
          ...otherStyles,
        };
      }
    }
    
    return {
      fontFamily: theme.typography.fontFamily.regular,
      ...otherStyles,
    };
  },
  
  // Helper function to create safe button style
  safeButton: (additionalStyle = {}) => {
    const { fontWeight, ...otherAdditionalStyles } = additionalStyle || {};
    
    // If fontWeight is provided, convert it to fontFamily
    if (fontWeight) {
      const weightMap = {
        'normal': 'Mulish-Regular',
        '400': 'Mulish-Regular',
        'medium': 'Mulish-Medium',
        '500': 'Mulish-Medium',
        'semibold': 'Mulish-SemiBold',
        '600': 'Mulish-SemiBold',
        'bold': 'Mulish-Bold',
        '700': 'Mulish-Bold',
      };
      
      const weight = weightMap[fontWeight];
      if (weight) {
        return {
          fontFamily: weight,
          ...otherAdditionalStyles,
        };
      }
    }
    
    return {
      fontFamily: theme.typography.fontFamily.bold,
      ...otherAdditionalStyles,
    };
  },
});

// Export the base styles for use without theme
export const baseStyles = StyleSheet.create({
  // Common utility styles that don't depend on theme
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  flex1: {
    flex: 1,
  },
  
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}); 
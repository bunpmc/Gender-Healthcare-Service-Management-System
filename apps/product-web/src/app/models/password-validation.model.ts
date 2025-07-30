// ========== PASSWORD VALIDATION INTERFACES ==========

export interface PasswordValidationRule {
  name: string;
  description: string;
  isValid: boolean;
  pattern?: RegExp;
  validator?: (password: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  rules: PasswordValidationRule[];
  suggestions: string[];
}

export interface PasswordFormValidation {
  password: PasswordValidationResult;
  confirmPassword: {
    isValid: boolean;
    matches: boolean;
    error?: string;
  };
  overall: {
    isValid: boolean;
    canSubmit: boolean;
  };
}

// ========== PASSWORD VALIDATION CONSTANTS ==========

export const PASSWORD_RULES: Omit<PasswordValidationRule, 'isValid'>[] = [
  {
    name: 'minLength',
    description: 'At least 8 characters',
    validator: (password: string) => password.length >= 8,
  },
  {
    name: 'hasUppercase',
    description: 'At least one uppercase letter (A-Z)',
    pattern: /[A-Z]/,
  },
  {
    name: 'hasLowercase',
    description: 'At least one lowercase letter (a-z)',
    pattern: /[a-z]/,
  },
  {
    name: 'hasNumber',
    description: 'At least one number (0-9)',
    pattern: /[0-9]/,
  },
  {
    name: 'hasSpecialChar',
    description: 'At least one special character (!@#$%^&*)',
    pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
  {
    name: 'noCommonPatterns',
    description: 'No common patterns (123, abc, qwerty)',
    validator: (password: string) => {
      const commonPatterns = [
        /123/i,
        /abc/i,
        /qwerty/i,
        /password/i,
        /admin/i,
        /user/i,
        /login/i,
        /welcome/i,
        /111/,
        /000/,
        /aaa/i,
      ];
      return !commonPatterns.some(pattern => pattern.test(password));
    },
  },
  {
    name: 'noRepeatingChars',
    description: 'No more than 2 repeating characters',
    validator: (password: string) => {
      return !/(.)\1{2,}/.test(password);
    },
  },
];

// ========== PASSWORD VALIDATION FUNCTIONS ==========

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      isValid: false,
      score: 0,
      strength: 'weak',
      rules: PASSWORD_RULES.map(rule => ({ ...rule, isValid: false })),
      suggestions: ['Please enter a password'],
    };
  }

  // Validate each rule
  const validatedRules: PasswordValidationRule[] = PASSWORD_RULES.map(rule => {
    let isValid = false;
    
    if (rule.pattern) {
      isValid = rule.pattern.test(password);
    } else if (rule.validator) {
      isValid = rule.validator(password);
    }

    return {
      ...rule,
      isValid,
    };
  });

  // Calculate score (each rule is worth points)
  const passedRules = validatedRules.filter(rule => rule.isValid).length;
  const totalRules = validatedRules.length;
  let score = Math.round((passedRules / totalRules) * 100);

  // Bonus points for length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Cap at 100
  score = Math.min(score, 100);

  // Determine strength
  let strength: PasswordValidationResult['strength'] = 'weak';
  if (score >= 90) strength = 'very-strong';
  else if (score >= 75) strength = 'strong';
  else if (score >= 60) strength = 'good';
  else if (score >= 40) strength = 'fair';

  // Generate suggestions
  const suggestions: string[] = [];
  validatedRules.forEach(rule => {
    if (!rule.isValid) {
      suggestions.push(rule.description);
    }
  });

  // Additional suggestions
  if (password.length < 12) {
    suggestions.push('Consider using 12+ characters for better security');
  }

  const isValid = passedRules >= 5; // At least 5 out of 7 rules must pass

  return {
    isValid,
    score,
    strength,
    rules: validatedRules,
    suggestions,
  };
}

export function validatePasswordMatch(password: string, confirmPassword: string): {
  isValid: boolean;
  matches: boolean;
  error?: string;
} {
  if (!confirmPassword) {
    return {
      isValid: false,
      matches: false,
      error: 'Please confirm your password',
    };
  }

  const matches = password === confirmPassword;
  
  return {
    isValid: matches,
    matches,
    error: matches ? undefined : 'Passwords do not match',
  };
}

export function validatePasswordForm(password: string, confirmPassword: string): PasswordFormValidation {
  const passwordValidation = validatePassword(password);
  const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

  const overall = {
    isValid: passwordValidation.isValid && confirmPasswordValidation.isValid,
    canSubmit: passwordValidation.isValid && confirmPasswordValidation.isValid,
  };

  return {
    password: passwordValidation,
    confirmPassword: confirmPasswordValidation,
    overall,
  };
}

export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  const colors = {
    'weak': '#ef4444',      // red-500
    'fair': '#f97316',      // orange-500
    'good': '#eab308',      // yellow-500
    'strong': '#22c55e',    // green-500
    'very-strong': '#16a34a', // green-600
  };
  return colors[strength];
}

export function getPasswordStrengthText(strength: PasswordValidationResult['strength']): string {
  const texts = {
    'weak': 'Weak',
    'fair': 'Fair',
    'good': 'Good',
    'strong': 'Strong',
    'very-strong': 'Very Strong',
  };
  return texts[strength];
}

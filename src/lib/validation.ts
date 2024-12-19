export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }
  return null;
};

export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  if (password.length < 8) {
    return {
      field: 'password',
      message: 'Password must be at least 8 characters long',
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain at least one number',
    };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain at least one special character',
    };
  }
  return null;
};

export const validateName = (name: string): ValidationError | null => {
  if (!name) {
    return { field: 'name', message: 'Name is required' };
  }
  if (name.length < 2) {
    return {
      field: 'name',
      message: 'Name must be at least 2 characters long',
    };
  }
  if (!/^[a-zA-Z\s-]+$/.test(name)) {
    return {
      field: 'name',
      message: 'Name can only contain letters, spaces, and hyphens',
    };
  }
  return null;
};

export const validateSignupForm = (formData: {
  name: string;
  email: string;
  password: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  const nameError = validateName(formData.name);
  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password);

  if (nameError) errors.push(nameError);
  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

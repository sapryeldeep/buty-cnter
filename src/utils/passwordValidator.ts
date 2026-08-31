import { User } from '../types';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a username and password against security and duplicate constraints
 * to prevent login overlaps and ensure data integrity.
 * 
 * @param username The username to validate
 * @param password The password to validate
 * @param excludeUser Pass the user object being edited to exclude it from duplicate checks
 * @param allUsers The list of all users in the system database
 */
export function validatePasswordAndUsername(
  username: string,
  password: string,
  excludeUser: string | null,
  allUsers: User[]
): PasswordValidationResult {
  const errors: string[] = [];

  // 1. Username Checks
  const trimmedUser = username.trim().toLowerCase();
  if (!trimmedUser) {
    errors.push('اسم المستخدم لا يمكن أن يكون فارغاً.');
  } else if (trimmedUser.length < 3) {
    errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل.');
  }

  // Check for duplicate username
  const isUsernameDup = allUsers.some(
    u => u.user.trim().toLowerCase() === trimmedUser && u.user !== excludeUser
  );
  if (isUsernameDup) {
    errors.push(`اسم الدخول "${username}" محجوز ومستخدم بالفعل لحساب آخر! يرجى اختيار اسم مستخدم فريد.`);
  }

  // 2. Password Checks
  if (!password) {
    errors.push('كلمة المرور لا يمكن أن تكون فارغة.');
  } else {
    // Length check
    if (password.length < 6) {
      errors.push('كلمة المرور ضعيفة جداً! يجب أن تكون 6 خانات أو أكثر.');
    }

    // Identical check
    if (password.trim().toLowerCase() === trimmedUser) {
      errors.push('يُمنع استخدام كلمة مرور مطابقة لاسم المستخدم منعاً للتداخل والاختراق.');
    }

    // Complexity checks: must contain both letters and numbers
    const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password); // supports Arabic letters too
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      errors.push('يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً لرفع درجة الأمان.');
    }

    // System-wide Password Uniqueness Check to prevent login crossovers
    const isPasswordDup = allUsers.some(
      u => u.pass === password && u.user !== excludeUser
    );
    if (isPasswordDup) {
      errors.push('⚠️ برجاء تغيير كلمة السر واختيار كلمة مرور أخرى (Please change the password and choose a different one).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

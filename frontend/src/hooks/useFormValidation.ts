import { useCallback, useMemo } from 'react';
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

interface UseFormValidationOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodSchema<T>;
  onSubmit?: (data: T) => void | Promise<void>;
  onError?: (errors: any) => void;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  onSubmit,
  onError,
  mode = 'onChange',
  ...formOptions
}: UseFormValidationOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode,
    ...formOptions,
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    clearErrors,
    setError,
    watch,
  } = form;

  // Enhanced submit handler with error handling
  const onSubmitHandler = useCallback(
    async (data: T) => {
      try {
        await onSubmit?.(data);
      } catch (error: any) {
        // Handle server validation errors
        if (error?.response?.data?.errors) {
          const serverErrors = error.response.data.errors;
          Object.keys(serverErrors).forEach((field) => {
            setError(field as Path<T>, {
              type: 'server',
              message: serverErrors[field],
            });
          });
        }
        onError?.(error);
      }
    },
    [onSubmit, onError, setError]
  );

  // Check if form has any errors
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  // Check if form is ready to submit
  const canSubmit = useMemo(
    () => isValid && !isSubmitting && isDirty,
    [isValid, isSubmitting, isDirty]
  );

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  // Reset form with new data
  const resetForm = useCallback(
    (data?: T) => {
      reset(data);
      clearErrors();
    },
    [reset, clearErrors]
  );

  // Get error count
  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);

  // Get first error message
  const firstError = useMemo(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (!firstErrorKey) return null;
    const error = errors[firstErrorKey];
    return error?.message || 'Validation error';
  }, [errors]);

  // Field validation helpers
  const getFieldError = useCallback(
    (fieldName: Path<T>) => {
      return errors[fieldName]?.message;
    },
    [errors]
  );

  const hasFieldError = useCallback(
    (fieldName: Path<T>) => {
      return !!errors[fieldName];
    },
    [errors]
  );

  // Validate specific field
  const validateField = useCallback(
    async (fieldName: Path<T>) => {
      try {
        await form.trigger(fieldName);
        return !errors[fieldName];
      } catch {
        return false;
      }
    },
    [form, errors]
  );

  // Validate entire form
  const validateForm = useCallback(async () => {
    try {
      const result = await form.trigger();
      return result && isValid;
    } catch {
      return false;
    }
  }, [form, isValid]);

  return {
    // Form instance
    ...form,

    // Enhanced handlers
    onSubmit: handleSubmit(onSubmitHandler),
    resetForm,
    clearAllErrors,

    // Validation state
    hasErrors,
    canSubmit,
    errorCount,
    firstError,
    errors,

    // Field helpers
    getFieldError,
    hasFieldError,
    validateField,
    validateForm,

    // Form state
    isSubmitting,
    isValid,
    isDirty,
    watchedValues: watch(),
  };
}

// Utility function to create validation schemas with common patterns
export function createValidationMessages(fieldName: string) {
  return {
    required: `${fieldName} is required`,
    invalid: `Please enter a valid ${fieldName.toLowerCase()}`,
    tooShort: (min: number) => `${fieldName} must be at least ${min} characters`,
    tooLong: (max: number) => `${fieldName} must be less than ${max} characters`,
    notNumber: `${fieldName} must be a number`,
    notEmail: 'Please enter a valid email address',
    notUrl: 'Please enter a valid URL',
    notPositive: `${fieldName} must be a positive number`,
    notInRange: (min: number, max: number) => 
      `${fieldName} must be between ${min} and ${max}`,
  };
}

export default useFormValidation;
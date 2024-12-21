import { useEffect, useRef, useCallback } from 'react';

interface FocusManagementOptions {
  trapFocus?: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
}

export function useFocusManagement(
  isOpen: boolean,
  options: FocusManagementOptions = {}
) {
  const { trapFocus = true, autoFocus = true, returnFocus = true } = options;
  
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => {
      return (
        !element.hasAttribute('disabled') &&
        !element.getAttribute('aria-hidden') &&
        element.getAttribute('tabindex') !== '-1'
      );
    }) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !isOpen || !containerRef.current) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Handle Tab key
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      // Handle Escape key
      if (event.key === 'Escape' && returnFocus) {
        event.preventDefault();
        previousActiveElement.current?.focus();
      }
    },
    [trapFocus, isOpen, getFocusableElements, returnFocus]
  );

  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Auto-focus the first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to the previously focused element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, autoFocus, handleKeyDown, getFocusableElements, returnFocus]);

  return containerRef;
}

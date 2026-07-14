import { createContext, useContext } from 'react';

export type FormChromeContextValue = {
  disabled: boolean;
  readOnly: boolean;
  loading: boolean;
};

const FormChromeContext = createContext<FormChromeContextValue>({
  disabled: false,
  readOnly: false,
  loading: false,
});

export const FormChromeProvider = FormChromeContext.Provider;

export function useFormChrome() {
  return useContext(FormChromeContext);
}

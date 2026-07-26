import React from 'react';
import { IMaskInput } from 'react-imask';
import {
  InputBaseComponentProps,
  OutlinedInput,
  OutlinedInputProps,
} from '@mui/material';

// IMaskInput's props are a discriminated union on `mask`; assert the shape we use.
const MaskedPatternInput = IMaskInput as unknown as React.ComponentType<
  React.ComponentProps<'input'> & {
    mask: string;
    inputRef?: React.Ref<HTMLInputElement>;
    onAccept?: (value: string) => void;
  }
>;

interface MaskedInputProps extends InputBaseComponentProps {
  mask: string;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
  onAccept?: (value: string) => void;
}

const MaskedInput = ({
  mask,
  placeholder,
  ref,
  onAccept,
  ...props
}: MaskedInputProps) => (
  <MaskedPatternInput
    {...props}
    mask={mask}
    placeholder={placeholder}
    inputRef={ref}
    onAccept={onAccept}
  />
);

export interface MaskedTextFieldProps extends OutlinedInputProps {
  mask: string;
  onAccept?: (value: string) => void;
}

export const MaskedTextField: React.FC<MaskedTextFieldProps> = ({
  mask,
  placeholder,
  onAccept,
  ...restProps
}) => {
  return (
    <OutlinedInput
      {...restProps}
      inputComponent={MaskedInput as React.ElementType<InputBaseComponentProps>}
      inputProps={{ mask, placeholder, onAccept }}
    />
  );
};

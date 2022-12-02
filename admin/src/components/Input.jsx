import React, { useState, useRef } from 'react';
import striptags from 'striptags';
import styled from 'styled-components';
import ReactContentEditable from 'react-contenteditable';
import { inputFocusStyle } from '@strapi/design-system';
import { IconButton } from '@strapi/design-system/IconButton';
import { Stack } from '@strapi/design-system/Stack';
import { useIntl } from 'react-intl';
import { Field, FieldHint, FieldError, FieldLabel } from '@strapi/design-system/Field';
import FormatClear from '../icons/FormatClear';
import Bold from '../icons/Bold';
import Code from '../icons/Code';
import CodeOff from '../icons/CodeOff';

const ContentEditable = styled(ReactContentEditable)`
    flex: 1;
    width: 100%;
    font-size: ${({ theme }) => theme.fontSizes[3]};
    line-height: ${({ theme }) => theme.lineHeights[2]};
    border-radius: ${({ theme }) => theme.borderRadius};
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    background: ${({ theme }) => theme.colors.neutral0};
    padding: ${({ theme }) => `${theme.spaces[2]} ${theme.spaces[4]}`};
    color: ${({ theme }) => theme.colors.neutral800};
    ${inputFocusStyle()}

    b {
        font-weight: ${({ theme }) => theme.fontWeights.bold};
    }
`;

const Preview = styled.div`
    background: ${({ theme }) => theme.colors.neutral100};
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    padding: ${({ theme }) => `${theme.spaces[2]} ${theme.spaces[4]}`};
    border-radius: ${({ theme }) => theme.borderRadius};
    font-size: ${({ theme }) => theme.fontSizes[2]};
    line-height: ${({ theme }) => theme.lineHeights[1]};
    color: ${({ theme }) => theme.colors.neutral500};
`;

const executeCommand = (commandId, value) => {
    // execCommand() is officially obsolete/deprecated but there's no alternative.
    // User agents cannot drop support for execCommand()
    // because so many services require support for it.
    document.execCommand(commandId, false, value);
};

const strip = (value) => {
    return value.length > 0 ? striptags(value, ['b', 'br']) : undefined;
};

const Input = ({ value, name, onChange, error, description, required, labelAction, intlLabel }) => {
    const ref = useRef();
    const { formatMessage } = useIntl();
    const [preview, setPreview] = useState(false);

    // Methods.
    const update = (value) => {
        onChange({ target: { name, value } });
    };

    const handleOnPaste = (event) => {
        event.preventDefault();
        const html = event.clipboardData.getData('text/html');

        // Replace <strong> for <b>.
        const value = strip(html.replace(/<strong[^>]*>/g, '<b>').replace(/<\/strong>/g, '</b>'));
        update(value);
    };

    const handleOnChange = (event) => {
        update(strip(event.target.value));
    };

    const handleOnClear = () => {
        update(striptags(value));
    };

    const handleOnPreview = () => {
        setPreview((preview) => !preview);
    };

    const handleOnKeyDown = (event) => {
        if (event.key === 'Escape') {
            ref.current?.blur();
        }
    };

    return (
        <Field name={name} id={name} error={error} hint={description && formatMessage(description)}>
            <Stack spacing={2}>
                <FieldLabel action={labelAction} required={required}>
                    {formatMessage(intlLabel)}
                </FieldLabel>
                <Stack spacing={2} horizontal>
                    <ContentEditable
                        innerRef={ref}
                        html={value ?? ''}
                        onPaste={handleOnPaste}
                        onChange={handleOnChange}
                        onKeyDown={handleOnKeyDown}
                    />
                    <IconButton
                        onClick={() => executeCommand('bold')}
                        label={formatMessage({ id: 'bold-title-editor.input.bold', defaultMessage: 'Bold' })}
                        icon={<Bold />}
                    />
                    <IconButton
                        onClick={handleOnClear}
                        label={formatMessage({ id: 'bold-title-editor.input.clear', defaultMessage: 'Clear format' })}
                        icon={<FormatClear />}
                    />
                    <IconButton
                        onClick={handleOnPreview}
                        label={formatMessage({ id: 'bold-title-editor.input.code', defaultMessage: 'Show code' })}
                        icon={preview ? <Code /> : <CodeOff />}
                    />
                </Stack>
                {value && preview && <Preview>{value}</Preview>}
                <FieldHint />
                <FieldError />
            </Stack>
        </Field>
    );
};

export default Input;

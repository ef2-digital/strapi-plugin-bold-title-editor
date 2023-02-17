import React, { useState, useRef } from 'react';
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
import { parse, NodeType } from 'node-html-parser';
import showdown from 'showdown';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

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

    b, strong {
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

const reduceParsed = (html, bold) => {
    return html.childNodes.reduce((a, c) => {
        if (c.nodeType === NodeType.TEXT_NODE) {
            return [...a, { type: 'text', text: c.text, bold: !!bold }];
        }

        if (c.nodeType === NodeType.ELEMENT_NODE && c.tagName === 'BR') {
            return [...a, { type: 'break' }];
        }

        if (c.nodeType === NodeType.ELEMENT_NODE && c.childNodes && (c.tagName === 'B' || c.tagName === 'STRONG')) {
            return [...a, ...reduceParsed(c, true)];
        }

        if (c.nodeType === NodeType.ELEMENT_NODE && c.childNodes && c.childNodes.length > 0) {
            return [...a, ...reduceParsed(c)];
        }

        return a;
    }, []);
};

const toMarkdown = (parsed, clear) => {
    return parsed.reduce((a, c) => {
        if (c.type === 'break' && !clear) {
            return `${a}  \n`;
        }

        if (c.type === 'text' && c.bold && !clear) {
            return `${a}**${clear ? c.text.replace(/(\n)/gm, '') : c.text}**`;
        }

        if (c.type === 'text') {
            return a + (clear ? c.text.replace(/(\n)/gm, '') : c.text);
        }

        return a;
    }, '');
};

const toHtml = (parsed, clear) => {
    return parsed.reduce((a, c) => {
        if (c.type === 'break' && !clear) {
            return clear ? a : `${a}<br>`;
        }

        if (c.type === 'text' && c.bold && !clear) {
            return `${a}<b>${c.text}</b>`;
        }

        if (c.type === 'text') {
            return a + c.text;
        }

        return a;
    }, '');
};

const getValueToUpdate = (html, markdown, clear) => {
    const parsed = reduceParsed(parse(html));
    return markdown ? toMarkdown(parsed, clear) : toHtml(parsed, clear);
};

const getHtml = (value, markdown) => {
    return value && markdown ? converter.makeHtml(value) : value ?? '';
};

const Input = ({ value, name, onChange, error, description, required, labelAction, intlLabel, attribute }) => {
    const ref = useRef();
    const { formatMessage } = useIntl();
    const [preview, setPreview] = useState(false);

    const markdown = !!(attribute.options && attribute.options.output === 'markdown');

    // Methods.
    const update = (value) => {
        onChange({ target: { name, value } });
    };

    const handleOnPaste = (event) => {
        event.preventDefault();
        const html = event.clipboardData.getData('text/html');

        update(getValueToUpdate(html, markdown));
    };

    const handleOnChange = (event) => {
        update(getValueToUpdate(getHtml(event.target.value, markdown), markdown));
    };

    const handleOnClear = () => {
        update(getValueToUpdate(getHtml(value, markdown), markdown, true));
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
                        html={getHtml(value, markdown)}
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

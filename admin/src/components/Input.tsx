import { useState, useRef, ClipboardEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import ReactContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { inputFocusStyle } from '@strapi/design-system';
import { Flex, IconButton, IconButtonGroup } from '@strapi/design-system';
import { useIntl, MessageDescriptor } from 'react-intl';
import { Field } from '@strapi/design-system';
import FormatClear from '../icons/FormatClear';
import Bold from '../icons/Bold';
import Code from '../icons/Code';
import CodeOff from '../icons/CodeOff';
import { parse, NodeType } from 'node-html-parser';
import showdown from 'showdown';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

type ParsedNode = {
  type: 'text' | 'break';
  text?: string;
  bold?: boolean;
};

const ContentEditable = styled(ReactContentEditable)`
  flex: 1;
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes[2]};
  line-height: ${({ theme }) => theme.lineHeights[2]};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: 1px solid transparent;
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

const executeCommand = (commandId: string, value?: string) => {
  document.execCommand(commandId, false, value);
};

interface ParsedHtmlNode {
  nodeType: number;
  tagName?: string;
  text?: string;
  childNodes?: ParsedHtmlNode[];
}

const reduceParsed = (html: ParsedHtmlNode, bold = false): ParsedNode[] => {
  return (
    html.childNodes?.reduce<ParsedNode[]>((acc, child) => {
      if (child.nodeType === NodeType.TEXT_NODE) {
        return [...acc, { type: 'text', text: child.text, bold }];
      }

      if (child.nodeType === NodeType.ELEMENT_NODE && child.tagName === 'BR') {
        return [...acc, { type: 'break' }];
      }

      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        child.childNodes &&
        (child.tagName === 'B' || child.tagName === 'STRONG')
      ) {
        return [...acc, ...reduceParsed(child, true)];
      }

      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        child.childNodes &&
        child.childNodes.length > 0
      ) {
        return [...acc, ...reduceParsed(child)];
      }

      return acc;
    }, []) ?? []
  );
};

const toMarkdown = (parsed: ParsedNode[], clear = false): string => {
  return parsed.reduce<string>((acc, node) => {
    if (node.type === 'break' && !clear) {
      return `${acc}  \n`;
    }

    if (node.type === 'text' && node.bold && !clear) {
      return `${acc}**${clear ? node.text?.replace(/(\n)/gm, '') : node.text}**`;
    }

    if (node.type === 'text') {
      return acc + (clear ? node.text?.replace(/(\n)/gm, '') : node.text);
    }

    return acc;
  }, '');
};

const toHtml = (parsed: ParsedNode[], clear = false): string => {
  return parsed.reduce<string>((acc, node) => {
    if (node.type === 'break' && !clear) {
      return clear ? acc : `${acc}<br>`;
    }

    if (node.type === 'text' && node.bold && !clear) {
      return `${acc}<b>${node.text}</b>`;
    }

    if (node.type === 'text') {
      return acc + node.text;
    }

    return acc;
  }, '');
};

const getValueToUpdate = (html: string, markdown: boolean, clear = false): string => {
  const parsed = reduceParsed(parse(html));

  if (parsed.every((node) => node.type === 'break')) {
    return '';
  }

  return markdown ? toMarkdown(parsed, clear) : toHtml(parsed, clear);
};

const getHtml = (value: string | undefined, markdown: boolean): string => {
  return value && markdown ? converter.makeHtml(value) : (value ?? '');
};

type InputProps = {
  value: string;
  name: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  error?: string;
  description?: MessageDescriptor;
  required?: boolean;
  labelAction?: React.ReactNode;
  intlLabel: MessageDescriptor;
  attribute: { options?: { output?: string } };
  hint?: string;
};

const Input: React.FC<InputProps> = ({
  value,
  name,
  onChange,
  error,
  description,
  required,
  labelAction,
  intlLabel,
  attribute,
  hint,
}) => {
  const ref = useRef<HTMLElement>(null);
  const { formatMessage } = useIntl();
  const [preview, setPreview] = useState(false);

  const markdown = !!(attribute.options && attribute.options.output === 'markdown');

  const update = (value: string) => {
    onChange({ target: { name, value } });
  };

  const handleOnPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');
    const html = event.clipboardData.getData('text/html');

    update(getValueToUpdate(html || plainText, markdown));
  };

  const handleOnChange = (event: ContentEditableEvent) => {
    update(getValueToUpdate(getHtml(event.target.value, markdown), markdown));
  };

  const handleOnClear = () => {
    update(getValueToUpdate(getHtml(value, markdown), markdown, true));
  };

  const handleOnPreview = () => {
    setPreview((prev) => !prev);
  };

  const handleOnKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      ref.current?.blur();
    }
  };

  return (
    <Field.Root name={name} id={name} error={error} hint={hint}>
      <Field.Label action={labelAction} required={required}>
        {name}
      </Field.Label>
      <Field.Hint />
      <Flex spacing={2}>
        <ContentEditable
          innerRef={ref as React.RefObject<HTMLElement>}
          html={getHtml(value, markdown)}
          onPaste={handleOnPaste}
          onChange={handleOnChange}
          onKeyDown={handleOnKeyDown}
        />
        <IconButtonGroup>
          <IconButton
            size="S"
            style={{ 'border-top-left-radius': '0px', 'border-bottom-left-radius': '0px' }}
            onClick={() => executeCommand('bold')}
            label={formatMessage({ id: 'bold-title-editor.input.bold', defaultMessage: 'Bold' })}
          >
            <Bold />
          </IconButton>
          <IconButton
            ize="S"
            onClick={handleOnClear}
            label={formatMessage({
              id: 'bold-title-editor.input.clear',
              defaultMessage: 'Clear format',
            })}
          >
            <FormatClear />
          </IconButton>
          <IconButton
            size="S"
            onClick={handleOnPreview}
            label={formatMessage({
              id: 'bold-title-editor.input.code',
              defaultMessage: 'Show code',
            })}
          >
            {preview ? <Code /> : <CodeOff />}
          </IconButton>
        </IconButtonGroup>
      </Flex>
      {value && preview && <Preview>{value}</Preview>}
      <Field.Error />
    </Field.Root>
  );
};

export default Input;

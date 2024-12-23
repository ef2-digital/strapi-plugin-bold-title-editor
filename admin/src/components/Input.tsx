import { useState, useRef, Ref } from 'react';
import styled from 'styled-components';
import { inputFocusStyle } from '@strapi/design-system';
import { IconButton, IconButtonGroup } from '@strapi/design-system';
import { useIntl, MessageDescriptor } from 'react-intl';
import { Field } from '@strapi/design-system';
import FormatClear from '../icons/FormatClear';
import Bold from '../icons/Bold';
import Code from '../icons/Code';
import CodeOff from '../icons/CodeOff';
import { parse, NodeType } from 'node-html-parser';
import showdown from 'showdown';
import { Grid } from '@strapi/design-system';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

type ParsedNode = {
  type: 'text' | 'break';
  text?: string;
  bold?: boolean;
};

const StyledContentEditable = styled.div`
  flex: 1;
  width: 100%;
  div {
    flex: 1;
    width: 100%;
    font-size: ${({ theme }) => theme.fontSizes[2]};
    line-height: ${({ theme }) => theme.lineHeights[2]};
    border-radius: ${({ theme }) => theme.borderRadius};
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    padding: ${({ theme }) => `${theme.spaces[2]} ${theme.spaces[4]}`};
    color: ${({ theme }) => theme.colors.neutral800};
    background: ${({ theme }) => theme.colors.neutral0};
    ${inputFocusStyle()}
  }
  b,
  strong {
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
  const ref = useRef<HTMLDivElement>(null);
  const { formatMessage } = useIntl();
  const [preview, setPreview] = useState(false);

  const markdown = !!(attribute.options && attribute.options.output === 'markdown');

  const update = (value: string) => {
    onChange({ target: { name, value } });
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

  const styles = styled(`
  flex: 1;
  width: 100%;
  font-size: ${({ theme }: { theme: any }) => theme.fontSizes[2]};
  line-height: ${({ theme }: { theme: any }) => theme.lineHeights[2]};
  border-radius: ${({ theme }: { theme: any }) => theme.borderRadius};
  border: 1px solid ${({ theme }: { theme: any }) => theme.colors.neutral200};
  padding: ${({ theme }: { theme: any }) => `${theme.spaces[2]} ${theme.spaces[4]}`};
  color: ${({ theme }: { theme: any }) => theme.colors.neutral800};
  background: ${({ theme }: { theme: any }) => theme.colors.neutral0};
  ${inputFocusStyle()}
  b, strong {
    font-weight: ${({ theme }: { theme: any }) => theme.fontWeights.bold};
  }
`);

  return (
    <Field.Root name={name} id={name} error={error} hint={hint}>
      <Field.Label action={labelAction} required={required}>
        {name}
      </Field.Label>
      <Field.Hint />
      <Grid.Root
        gap={{
          large: 5,
          medium: 2,
          initial: 1,
        }}
        style={{ alignItems: 'flex-start' }}
      >
        <Grid.Item xs={12} col={9}>
          <StyledContentEditable>
            <ContentEditable
              ref={ref as Ref<ContentEditable>}
              html={getHtml(value, markdown)}
              disabled={false}
              onChange={handleOnChange}
              tagName="div"
              className="contentEditable"
              style={{
                flex: 1,
                width: '100%',
              }}
            />
          </StyledContentEditable>
        </Grid.Item>
        <Grid.Item xs={12} col={3}>
          <IconButtonGroup>
            <IconButton
              size="S"
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
        </Grid.Item>
      </Grid.Root>
      {value && preview && <Preview>{value}</Preview>}
      <Field.Error />
    </Field.Root>
  );
};

export default Input;

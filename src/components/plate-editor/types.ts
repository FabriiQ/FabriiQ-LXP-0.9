import { Value } from '@udecode/plate';

export type EditorValue = Value;

export type PlateEditorProps = {
  initialValue?: EditorValue;
  onChange?: (value: EditorValue) => void;
  readOnly?: boolean;
  placeholder?: string;
  variant?: 'default' | 'demo' | 'fullWidth' | 'select' | 'comment' | 'ai' | 'aiChat';
  components?: Record<string, any>;
};
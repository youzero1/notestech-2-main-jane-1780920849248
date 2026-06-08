
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  return (
    <div className="rounded-md overflow-hidden">
      <SunEditor
        setContents={value}
        onChange={onChange}
        setOptions={{
          buttonList: [
            ['undo', 'redo'],
            ['font', 'fontSize', 'formatBlock'],
            ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
            ['removeFormat'],
            ['outdent', 'indent'],
            ['align', 'horizontalRule', 'list', 'table'],
            ['link', 'image', 'video'],
            ['fullScreen', 'showBlocks', 'codeView'],
          ],
          defaultTag: 'p',
          minHeight: '300px',
          showPathLabel: false,
        }}
      />
    </div>
  );
};

export default RichTextEditor;

import * as React from 'react';
import * as xlsx from 'xlsx';

const formStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: 'auto',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  textAlign: 'center',
};

const headerStyle: React.CSSProperties = {
  fontSize: '24px',
  marginBottom: '20px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: '#007bff',
  color: '#fff',
  cursor: 'pointer',
};

interface DataObject {
  [key: string]: any;
}

function App() {
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');

  const convertXML = (
    data: any,
    tagName: string,
    arrayElementTag = 'element',
    spaces = 0,
  ): string => {
    const tag = tagName
      .replace(/[^_a-zA-Z 0-9:\-.]/g, '')
      .replace(/^([ 0-9-:\-.]|(xml))+/i, '')
      .replace(/ +/g, '-');

    const indentSpaces = Array(spaces + 1).join(' ');

    if (data === null || data === undefined) {
      return `${indentSpaces}<${tag} />`;
    }
    const content =
      // eslint-disable-next-line no-nested-ternary
      Object.prototype.toString.call(data) === '[object Array]'
        ? data
            .map((item: any) =>
              convertXML(item, arrayElementTag, arrayElementTag, spaces + 2),
            )
            .join('\n')
        : typeof data === 'object'
        ? Object.keys(data)
            .map((key) => [key, data[key]])
            .map(([key, value]) =>
              convertXML(value, key, arrayElementTag, spaces + 2),
            )
            .join('\n')
        : `${indentSpaces}  ${String(data).replace(/([<>&])/g, (_, $1) => {
            switch ($1) {
              case '<':
                return '&lt;';
              case '>':
                return '&gt;';
              case '&':
                return '&amp;';
              default:
                return '';
            }
          })}`;

    const contentWithWrapper = `${indentSpaces}<${tag}>
            ${content}
            ${indentSpaces}</${tag}>`;

    return contentWithWrapper;
  };

  const createXMLData = (data: any, filename: string): void => {
    const content = `<?xml version="1.0" encoding="utf-8"?>
    <CDRC xmlns="http://bsp.gov.ph/xml/CDRC/1.0">
    ${convertXML(data, 'Header')}
    </CDRC>
    `;

    const dataStr = `data:text/application/xml;charset=utf-8,${encodeURIComponent(
      content,
    )}`;

    const element = document.createElement('a');
    element.href = dataStr;
    element.download = `${filename}`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const readUploadFile = (file: File): void => {
    const reader = new FileReader();
    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');

    const xmlFileName = `${fileNameWithoutExtension}.xml`;

    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer;
      const workbook = xlsx.read(data, { type: 'array' });
      const worksheetA = workbook.Sheets.CDRC_A;
      const worksheetB = workbook.Sheets.CDRC_B;

      const jsonA: any = xlsx.utils.sheet_to_json(worksheetA);
      const jsonB: any = xlsx.utils.sheet_to_json(worksheetB);

      console.table(jsonA);
      console.table(jsonB);

      let valueD22 = '';
      const cellD22 = worksheetB.D22;
      if (cellD22 && cellD22.v) {
        valueD22 = cellD22.v.toString();
      } else {
        console.error('Error accessing cell D22 in CDRC_B sheet');
      }

      const mJson: any[] = [];
      const days = [
        'Consolidated Daily Report of Condition_3',
        'Consolidated Daily Report of Condition_4',
        'Consolidated Daily Report of Condition_5',
        'Consolidated Daily Report of Condition_6',
        'Consolidated Daily Report of Condition_7',
        'Consolidated Daily Report of Condition_8',
        'Consolidated Daily Report of Condition_9',
      ];
      const daysList: any = {
        'Consolidated Daily Report of Condition_3': 'C0020',
        'Consolidated Daily Report of Condition_4': 'C0030',
        'Consolidated Daily Report of Condition_5': 'C0040',
        'Consolidated Daily Report of Condition_6': 'C0050',
        'Consolidated Daily Report of Condition_7': 'C0060',
        'Consolidated Daily Report of Condition_8': 'C0070',
        'Consolidated Daily Report of Condition_9': 'C0080',
      };
      for (let i = 0; i < jsonA.length; i++) {
        if (i > 3) {
          const newJson = jsonA[i];
          delete newJson.CDRC_A;
          delete newJson['Consolidated Daily Report of Condition'];
          mJson.push(newJson);
        }
      }
      const newArr: any[] = [];
      console.log('mjsob', mJson);
      for (let j = 0; j < mJson.length - 1; j++) {
        const item = mJson[j];
        const tempArr: any = {};
        for (let k = 0; k < days.length; k++) {
          if (
            item[days[k]] != null &&
            item['Consolidated Daily Report of Condition_1']
          ) {
            const tempDate = days[k];
            const CHash = daysList[tempDate];
            const keyS = `${item['Consolidated Daily Report of Condition_1']}${CHash}`;
            tempArr[keyS] = item[days[k]];
          }
        }
        newArr.push(tempArr);
      }
      const filteredArr = newArr.filter((item) => {
        return !!Object.keys(item).length;
      });

      let main: DataObject = {};
      filteredArr.forEach((item: any) => {
        main = {
          ...main,
          ...item,
        };
      });

      console.log('Main', main);

      createXMLData(
        {
          Header: {
            Undertaking: 120011728821,
            FromDate: fromDate,
            ToDate: toDate,
          },
          CDRC_A: { MAIN: main },
          CDRC_B: {
            MAIN: {
              R0120C0010: valueD22,
            },
          },
        },
        xmlFileName,
      );
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const fileInput = document.getElementById('upload') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      readUploadFile(fileInput.files[0]);
    }
  };

  const setDate1 = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFromDate(event.target.value);
  };
  const setDate2 = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setToDate(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h1 style={headerStyle}>Upload File</h1>
      <input type="file" name="upload" id="upload" style={inputStyle} />
      <input
        type="date"
        name="fromDate"
        id="fromDate"
        onChange={setDate1}
        style={inputStyle}
      />
      <input
        type="date"
        name="toDate"
        id="toDate"
        onChange={setDate2}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Submit
      </button>
    </form>
  );
}

export default App;

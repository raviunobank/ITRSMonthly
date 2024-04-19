/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import * as xlsx from 'xlsx';

function App() {
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [amount, setAmountValue] = React.useState('');

  function convertXML(
    data: any,
    tagName: string,
    arrayElementTag = 'element',
    spaces = 0,
  ): string {
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
  }

  function createXMLData(data: any): void {
    const content = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE CDRC>
    ${convertXML(data, 'CDRC')}
    `;

    const dataStr = `data:text/application/xml;charset=utf-8,${encodeURIComponent(
      content,
    )}`;

    const element = document.createElement('a');
    element.href = dataStr;
    element.download = 'myFile.xml';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  const readUploadFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer;
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any = xlsx.utils.sheet_to_json(worksheet);

      const mJson = [];
      const days = [
        '__EMPTY_4',
        '__EMPTY_5',
        '__EMPTY_6',
        '__EMPTY_7',
        '__EMPTY_8',
        '__EMPTY_9',
        '__EMPTY_10',
      ];
      const daysList: any = {
        __EMPTY_4: 'C0020',
        __EMPTY_5: 'C0030',
        __EMPTY_6: 'C0040',
        __EMPTY_7: 'C0050',
        __EMPTY_8: 'C0060',
        __EMPTY_9: 'C0070',
        __EMPTY_10: 'C0080',
      };
      for (let i = 0; i < json.length; i++) {
        if (i > 3) {
          const newJson = json[i];
          delete newJson.__EMPTY;
          delete newJson.__EMPTY_1;
          delete newJson.__EMPTY_3;

          mJson.push(newJson);
        }
      }
      const newArr = [];
      console.log('mjsob', mJson);
      for (let j = 0; j < mJson.length; j++) {
        const item = mJson[j];
        const tempArr: any = {};
        for (let k = 0; k < days.length; k++) {
          if (item[days[k]] != null && item?.__EMPTY_2) {
            const tempDate = days[k];
            const CHash = daysList[tempDate];
            const keyS = `${item.__EMPTY_2}${CHash}`;
            tempArr[keyS] = item[days[k]];
          }
        }
        newArr.push(tempArr);
      }
      const filteredArr = newArr.filter((item) => {
        return !!Object.keys(item).length;
      });

      let main = {};
      filteredArr.forEach((item: any) => {
        main = {
          ...main,
          ...item,
        };
      });

      console.log();

      createXMLData({
        Header: {
          Undertaking: 120011728821,
          FromDate: fromDate,
          ToDate: toDate,
        },
        CDRC_A: { MAIN: main },
        CDRC_B: {
          MAIN: {
            R0130C0010: amount,
          },
        },
      });
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

  function setDate1(event: React.ChangeEvent<HTMLInputElement>): void {
    setFromDate(event.target.value);
  }
  function setDate2(event: React.ChangeEvent<HTMLInputElement>): void {
    setToDate(event.target.value);
  }

  function setAmount(event: React.ChangeEvent<HTMLInputElement>): void {
    setAmountValue(event.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Upload File</h1>
      <input type="file" name="upload" id="upload" />
      <input type="date" name="fromDate" id="fromDate" onChange={setDate1} />
      <input type="date" name="toDate" id="toDate" onChange={setDate2} />
      <input type="text" name="amount" id="amount" onChange={setAmount} />
      <button type="submit">Submit</button>
    </form>
  );
}

export default App;

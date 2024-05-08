import React, { useState } from 'react';
import * as xlsx from 'xlsx';

const formStyle = {
  maxWidth: '400px',
  margin: 'auto',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  textAlign: 'center',
};

const headerStyle = {
  fontSize: '24px',
  marginBottom: '20px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: '#007bff',
  color: '#fff',
  cursor: 'pointer',
};

function App() {
  const [fromDate, setFromDate] = useState('');

  const createXMLData = (data: string | number | boolean, filename: string) => {
    const dataStr = `data:text/application/xml;charset=utf-8,${encodeURIComponent(
      data,
    )}`;
    const element = document.createElement('a');
    element.href = dataStr;
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const readUploadFile = (file: Blob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetNames = workbook.SheetNames;

      const workbook1 = workbook.Sheets[sheetNames[0]];
      const cellDataE11 = workbook1.E11 ? workbook1.E11.v : '';
      const cellDataE12 = workbook1.E12 ? workbook1.E12.v : '';

      const scheduleData = `<ITRS_-_Schedule_0>
        <Content_of_submission>
          <Reference_date>${fromDate}</Reference_date>
          <R0010C0010>${cellDataE11}</R0010C0010>
          <R0020C0010>${cellDataE12}</R0020C0010>
        </Content_of_submission>
      </ITRS_-_Schedule_0>`;

      let xmlData2 = '';
      const workbook2 = workbook.Sheets[sheetNames[1]];
      console.table(workbook2);
      let maxRow = 0;
      let maxCol = 0;

      // Find the last row with data
      // eslint-disable-next-line no-restricted-syntax
      for (const cellAddress in workbook2) {
        if (
          cellAddress.match(/[A-Z]+[1-9][0-9]*$/) &&
          workbook2[cellAddress].v !== undefined
        ) {
          const row = parseInt(cellAddress.match(/[1-9][0-9]*$/)[0], 10);
          maxRow = Math.max(maxRow, row);
        }
      }

      // Find the last column with data
      // eslint-disable-next-line no-restricted-syntax
      for (const cellAddress in workbook2) {
        if (
          cellAddress.match(/[A-Z]+[1-9][0-9]*$/) &&
          workbook2[cellAddress].v !== undefined
        ) {
          const col = xlsx.utils.decode_col(cellAddress.match(/[A-Z]+/)[0]);
          maxCol = Math.max(maxCol, col);
        }
      }

      const range = { s: { c: 1, r: 7 }, e: { c: maxCol, r: maxRow } };

      const data2Sheet = [];
      // eslint-disable-next-line no-plusplus
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const row = [];
        // eslint-disable-next-line no-plusplus
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = xlsx.utils.encode_cell({ c: C, r: R });
          const cell = workbook2[cellAddress];
          if (cell?.v !== undefined) {
            row.push(cell?.v);
          } else {
            row.push('');
          }
        }
        data2Sheet.push(row);
      }

      data2Sheet.forEach((row) => {
        let xmlElement2 = '';
        row.forEach((cell, index) => {
          const cellValue = cell === 0 ? 0 : cell || ''; // Check if cell is 0, otherwise use cell value or empty string
          // eslint-disable-next-line no-use-before-define
          const val = generateXmlElement(columnHeaders[index], cellValue);
          xmlElement2 += val !== undefined ? val : '';
        });
        xmlData2 += `<SCH_13_1_T_Item>${xmlElement2}</SCH_13_1_T_Item>`;
      });

      let xmlData3 = '';
      const workbook3 = workbook.Sheets[sheetNames[2]]; // Accessing third sheet
      // const range = { s: { c: 1, r: 7 }, e: { c: 48, r: 1000 } }; // Define your range

      const data3Sheet = [];
      // eslint-disable-next-line no-plusplus
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const row = [];
        // eslint-disable-next-line no-plusplus
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = xlsx.utils.encode_cell({ c: C, r: R });
          const cell = workbook3[cellAddress];
          if (cell?.v !== undefined) {
            row.push(cell?.v);
          } else {
            row.push('');
          }
        }
        data3Sheet.push(row);
      }

      data3Sheet.forEach((row) => {
        let xmlElement3 = '';
        row.forEach((cell, index) => {
          const cellValue = cell === 0 ? 0 : cell || '';
          // eslint-disable-next-line no-use-before-define
          xmlElement3 += generateXmlElement(columnHeaders[index], cellValue);
        });
        xmlData3 += `<SCH_15_1_T_Item>${xmlElement3}</SCH_15_1_T_Item>`;
      });

      const xmlData = `<ITRS_M xmlns="http://bsp.gov.ph/xml/ITRS_M/1.0">
        <Header>
          <Undertaking>10000002</Undertaking>
          <Year>2024</Year>
          <Period>3</Period>
        </Header>
        ${scheduleData}
        <SCH_13_1>
        <SCH_13_1_T>
        ${xmlData2}
        </SCH_13_1_T>
        </SCH_13_1>
        <SCH_15_1>
        <SCH_15_1_T>
        ${xmlData3}
        </SCH_15_1_T>
        </SCH_15_1>

      </ITRS_M>`;

      createXMLData(xmlData, 'ITRS_Schedule_0.xml');
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

  const columnHeaders = [
    'C0010',
    'C0020',
    'C0030',
    'C0040',
    'C0050',
    'C0060',
    'C0070',
    'C0080',
    'C0090',
    'C0100',
    'C0110',
    'C0120',
    'C0130',
    'C0140',
    'C0150',
    'C0160',
    'C0170',
    'C0180',
    'C0190',
    'C0200',
    'C0210',
    'C0220',
    'C0230',
    'C0240',
    'C0250',
    'C0260',
    'C0270',
    'C0280',
    'C0290',
    'C0300',
    'C0310',
    'C0320',
    'C0330',
    'C0340',
    'C0350',
    'C0360',
    'C0370',
    'C0380',
    'C0390',
    'C0400',
    'C0410',
    'C0420',
    'C0430',
    'C0440',
    'C0450',
    'C0460',
    'C0470',
    'C0480',
  ];

  function generateXmlElement(
    header: string,
    value: null | undefined | string,
  ) {
    if (!header || value == null || value === '') {
      return ''; // Return empty string if header is undefined, or if value is null, undefined, or an empty string
    }
    return `<${header}>${value}</${header}>`;
  }

  const setDate1 = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setFromDate(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h1 style={headerStyle}>ITRS Upload file</h1>
      <input type="file" name="upload" id="upload" style={inputStyle} />
      <input
        type="date"
        name="fromDate"
        id="fromDate"
        onChange={setDate1}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Submit
      </button>
    </form>
  );
}

export default App;

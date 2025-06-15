import React from 'react';

interface TableRendererProps {
  data: {
    headers?: string[];
    rows: string[][];
  };
  isPrintMode?: boolean;
  className?: string;
}

export const TableRenderer: React.FC<TableRendererProps> = ({
  data,
  isPrintMode = false,
  className = '',
}) => {
  const { headers, rows } = data;
  
  return (
    <div className={`table-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      <table>
        {headers && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`header-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <style jsx>{`
        .table-renderer {
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        
        .table-renderer table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          font-size: 0.875rem;
        }
        
        .table-renderer th,
        .table-renderer td {
          padding: 0.75rem;
          text-align: left;
          border: 1px solid #e2e8f0;
        }
        
        .table-renderer th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #1e293b;
        }
        
        .table-renderer tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .print-mode table {
          font-size: 10pt;
        }
        
        .print-mode th,
        .print-mode td {
          padding: 0.5rem;
        }
        
        @media print {
          .table-renderer {
            break-inside: avoid;
          }
          
          .table-renderer table {
            font-size: 10pt;
          }
          
          .table-renderer th,
          .table-renderer td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

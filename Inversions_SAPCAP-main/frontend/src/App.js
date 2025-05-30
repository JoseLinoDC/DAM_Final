import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Typography, TextField, IconButton, Tooltip
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';

const endpoints = [
  { label: 'Usuarios', url: '/api/inv/GetAllUsers' },
  { label: 'Estrategias', url: '/api/inv/GetAllStrategies' },
  { label: 'Mis Estrategias', url: '/api/inv/GetStrategiesByUser', requiresUserId: true }
];

function App() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortedColumn, setSortedColumn] = useState(null);

  useEffect(() => {
    if (endpoints[tab].requiresUserId && !userId) {
      setData([]);
      return;
    }

    const url = endpoints[tab].requiresUserId
      ? `${endpoints[tab].url}?USER_ID=${userId}`
      : endpoints[tab].url;

    axios.get(url)
      .then(res => {
        const result = res.data?.value || res.data || [];
        setData(Array.isArray(result) ? result : []);
      })
      .catch(err => {
        console.error('Error al obtener los datos:', err);
      });
  }, [tab, userId]);

  const handleSort = (column) => {
    const newSortDirection = sortedColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newSortDirection);
    setSortedColumn(column);

    const sortedData = [...data].sort((a, b) => {
      if (a[column] < b[column]) return newSortDirection === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return newSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  };

  return (
    <Box sx={{ backgroundColor: '#f0f2f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{
        maxWidth: 1200,
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: 4,
        boxShadow: 3,
        p: 4
      }}>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} centered>
          {endpoints.map((ep, i) => <Tab key={i} label={ep.label} />)}
        </Tabs>

        {endpoints[tab].requiresUserId && (
          <Box sx={{ mt: 3 }}>
            <TextField
              label="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              variant="outlined"
              fullWidth
            />
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          {data.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{
                minWidth: 650,
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& th, & td': {
                  borderBottom: '1px solid #e0e0e0',
                  padding: '8px 16px',
                  whiteSpace: 'nowrap', // Fuerza que el texto no haga salto de línea
                },
              }}>
                <TableHead>
                  <TableRow>
                    {Object.keys(data[0]).map((key) => (
                      <TableCell key={key} sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f9fafb',
                        color: '#333',
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderBottom: '2px solid #ddd',
                      }} onClick={() => handleSort(key)}>
                        <Tooltip title="Ordenar por esta columna">
                          <IconButton size="small">
                            <SortIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i} sx={{
                      '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                      '&:hover': { backgroundColor: '#f1f1f1' }
                    }}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} sx={{ textAlign: 'center' }}>
                          {JSON.stringify(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {endpoints[tab].requiresUserId && !userId
                ? 'Ingresa un USER_ID para ver resultados.'
                : 'No hay datos disponibles.'}
            </Typography>
          )}
</Box>

      </Box>
    </Box>
  );
}

export default App;

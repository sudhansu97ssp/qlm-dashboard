import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { ShieldCheck, Plus, PowerOff, ShieldAlert } from 'lucide-react';

const actionIcons = {
  CreateKey: { icon: Plus, bg: '#ecfdf5', color: '#059669', label: 'Create Key' },
  DeactivateKey: { icon: PowerOff, bg: '#fffbeb', color: '#d97706', label: 'Deactivate' },
  RevokeKey: { icon: ShieldAlert, bg: '#fef2f2', color: '#dc2626', label: 'Revoke Key' }
};

export default function AuditLogsView({ auditLogs = [] }) {
  return (
    <Box sx={{ pb: 4 }}>
      <Card>
        <CardContent sx={{ p: '20px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                QLM Security & Operation Audit Trail
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Immutable event stream for all license creations, deactivations, and revocations
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Action</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Entity & Target ID</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Operator</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Timestamp</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    const actionInfo = actionIcons[log.Action] || { icon: ShieldCheck, bg: '#f1f5f9', color: '#475569', label: log.Action };
                    const IconComp = actionInfo.icon;
                    return (
                      <TableRow key={log.LogID} hover>
                        <TableCell>
                          <Chip
                            icon={<IconComp size={12} color={actionInfo.color} />}
                            label={actionInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: actionInfo.bg,
                              color: actionInfo.color,
                              fontWeight: 600,
                              fontSize: '0.725rem',
                              borderRadius: '4px'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-mono" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                            {log.EntityID}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {log.Entity}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#475569' }}>
                            {log.PerformedBy}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 350 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#334155' }}>
                            {log.Details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {new Date(log.Timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={log.Status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: log.Status === 'Success' ? '#ecfdf5' : '#fef2f2',
                              color: log.Status === 'Success' ? '#059669' : '#dc2626',
                              borderRadius: '4px'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>No audit logs recorded yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

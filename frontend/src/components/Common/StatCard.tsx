import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactElement;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  color = 'primary',
  loading = false,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton 
            variant="text" 
            width="40%" 
            height={isMobile ? 32 : 40} 
          />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        minHeight: { xs: 120, sm: 140 },
        '&:hover': {
          transform: isMobile ? 'translateY(-2px)' : 'translateY(-4px)',
          boxShadow: isMobile ? theme.shadows[4] : theme.shadows[8],
        },
        // Touch-friendly on mobile
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: { xs: 1.5, sm: 2 }
        }}>
          <Typography 
            color="text.secondary" 
            gutterBottom 
            variant="body2"
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                backgroundColor: theme.palette[color].light + '20',
                borderRadius: { xs: 1.5, sm: 2 },
                p: { xs: 0.75, sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: { xs: 32, sm: 40 },
                minHeight: { xs: 32, sm: 40 },
              }}
            >
              {React.cloneElement(icon, {
                sx: { 
                  color: theme.palette[color].main, 
                  fontSize: { xs: 18, sm: 24 }
                }
              })}
            </Box>
          )}
        </Box>
        
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          {value}
        </Typography>
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {subtitle}
          </Typography>
        )}
        
        {change !== undefined && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            flexWrap: 'wrap'
          }}>
            <Chip
              icon={change >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${change >= 0 ? '+' : ''}${change}%`}
              size="small"
              color={change >= 0 ? 'success' : 'error'}
              sx={{ 
                fontWeight: 600,
                '& .MuiChip-label': {
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                },
                '& .MuiChip-icon': {
                  fontSize: { xs: 14, sm: 16 }
                },
                height: { xs: 24, sm: 32 }
              }}
            />
            {changeLabel && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
              >
                {changeLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
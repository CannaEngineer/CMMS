import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogContent,
  DialogActions,
  Backdrop,
  Fade,
  Grow,
  Slide,
  Popper,
  ClickAwayListener,
  useTheme,
  alpha,
  styled,
  keyframes,
  Chip,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  NotificationsActive as NotificationsIcon,
  Settings as SettingsIcon,
  TouchApp as TouchIcon,
  Swipe as SwipeIcon,
  Keyboard as KeyboardIcon,
  Accessibility as AccessibilityIcon,
  Speed as SpeedIcon,
  School as LearnIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material';

// Enhanced animations for onboarding
const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const popIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const highlight = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Enhanced onboarding container
const OnboardingContainer = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  overflow: 'hidden',
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.12)}`,
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

const StepCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${slideInFromRight} 0.5s ease-out`,
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
  },
}));

const HighlightOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  background: alpha(theme.palette.common.black, 0.7),
  zIndex: 9998,
  pointerEvents: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const TargetHighlight = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: 8,
  animation: `${highlight} 2s infinite`,
  pointerEvents: 'none',
  zIndex: 9999,
  border: `3px solid ${theme.palette.primary.main}`,
  background: alpha(theme.palette.primary.main, 0.1),
  backdropFilter: 'blur(2px)',
}));

const TooltipContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 16,
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.15)}`,
  maxWidth: 360,
  position: 'relative',
  animation: `${popIn} 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 16,
    height: 16,
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    borderBottom: 'none',
    borderRight: 'none',
    borderRadius: '2px 0 0 0',
    transform: 'translateX(-50%) rotate(45deg)',
  },
}));

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'demo' | 'wait';
    duration?: number;
    callback?: () => void;
  };
  icon?: React.ReactElement;
  tips?: string[];
  interactive?: boolean;
}

interface NotificationOnboardingProps {
  open: boolean;
  onClose: () => void;
  userRole?: 'ADMIN' | 'MANAGER' | 'TECHNICIAN';
  onComplete?: () => void;
  skipEnabled?: boolean;
  startStep?: number;
}

const getOnboardingSteps = (userRole: string): OnboardingStep[] => {
  const baseSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Smart Notifications!',
      content: 'Let\'s get you set up with notifications that work perfectly for your role and workflow.',
      icon: <NotificationsIcon />,
      tips: [
        'This tour takes less than 2 minutes',
        'You can skip or restart anytime',
        'Settings can be changed later',
      ],
    },
    {
      id: 'bell-location',
      title: 'Your Notification Center',
      content: 'This is where you\'ll see your notification count. Click here anytime to view and manage your notifications.',
      target: '#notification-bell',
      position: 'bottom',
      action: { type: 'demo', duration: 2000 },
      icon: <NotificationsIcon />,
      tips: [
        'Red badge shows unread count',
        'Click to open notification center',
        'Green dot means live connection',
      ],
    },
    {
      id: 'notification-center',
      title: 'Notification Center Features',
      content: 'View, organize, and act on your notifications. Use tabs to filter between all notifications and unread items.',
      target: '.notification-center',
      position: 'left',
      icon: <TouchIcon />,
      tips: [
        'Notifications are grouped intelligently',
        'Click to view details',
        'Swipe for quick actions on mobile',
      ],
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      content: 'Hover over notifications to see quick actions. Mark as read, archive, or take immediate action without opening.',
      target: '.notification-item:first-child',
      position: 'right',
      action: { type: 'demo', duration: 3000 },
      icon: <SpeedIcon />,
      tips: [
        'Hover to reveal action buttons',
        'Keyboard shortcuts: R (read), A (archive)',
        'Long press on mobile for actions',
      ],
    },
    {
      id: 'gestures',
      title: 'Touch Gestures (Mobile)',
      content: 'On mobile devices, swipe right to mark as read, swipe left to archive. Perfect for quick management on the go.',
      icon: <SwipeIcon />,
      interactive: true,
      tips: [
        'Swipe right → Mark as read',
        'Swipe left → Archive',
        'Long press → Action menu',
      ],
    },
    {
      id: 'accessibility',
      title: 'Accessibility Features',
      content: 'Full keyboard navigation, screen reader support, and high contrast mode. Press Tab to navigate, Enter to select.',
      icon: <AccessibilityIcon />,
      tips: [
        'Tab navigation supported',
        'Screen reader friendly',
        'High contrast mode available',
        'Audio feedback optional',
      ],
    },
    {
      id: 'preferences',
      title: 'Customize Your Experience',
      content: 'Set up notification preferences for different categories, choose delivery methods, and set quiet hours.',
      target: '.notification-settings',
      position: 'bottom',
      icon: <SettingsIcon />,
      tips: [
        'Customize by category',
        'Set quiet hours',
        'Choose delivery methods',
        'Priority filtering',
      ],
    },
  ];

  // Role-specific customizations
  const roleSpecificSteps: Record<string, Partial<OnboardingStep>> = {
    TECHNICIAN: {
      id: 'technician-specific',
      title: 'For Maintenance Technicians',
      content: 'You\'ll receive work order assignments, asset alerts, and maintenance reminders. Urgent items are highlighted in red and never grouped.',
      icon: <NotificationsIcon />,
      tips: [
        'Work orders appear immediately',
        'Urgent items are never hidden',
        'Asset alerts show location',
        'Maintenance schedules included',
      ],
    },
    MANAGER: {
      id: 'manager-specific',
      title: 'For Managers',
      content: 'Get team updates, escalations, and summary reports. Notifications are intelligently grouped to reduce clutter while keeping you informed.',
      icon: <NotificationsIcon />,
      tips: [
        'Team performance summaries',
        'Escalation alerts',
        'Resource requests',
        'Daily/weekly digests available',
      ],
    },
    ADMIN: {
      id: 'admin-specific',
      title: 'For Administrators',
      content: 'Receive system alerts, user notifications, and administrative updates. Full control over system-wide notification settings.',
      icon: <NotificationsIcon />,
      tips: [
        'System health alerts',
        'User management updates',
        'Security notifications',
        'System-wide controls',
      ],
    },
  };

  // Insert role-specific step after welcome
  const steps = [...baseSteps];
  if (roleSpecificSteps[userRole]) {
    steps.splice(1, 0, roleSpecificSteps[userRole] as OnboardingStep);
  }

  return steps;
};

export const NotificationOnboarding: React.FC<NotificationOnboardingProps> = ({
  open,
  onClose,
  userRole = 'TECHNICIAN',
  onComplete,
  skipEnabled = true,
  startStep = 0,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(startStep);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  
  const steps = getOnboardingSteps(userRole);
  const currentStepData = steps[currentStep];
  
  // Find and highlight target elements
  useEffect(() => {
    if (currentStepData?.target && open) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Set tooltip anchor based on position
        setTooltipAnchor(element);
      }
    } else {
      setTargetElement(null);
      setTooltipAnchor(null);
    }
  }, [currentStep, currentStepData, open]);

  // Auto-advance for demo steps
  useEffect(() => {
    if (currentStepData?.action?.type === 'demo' && open) {
      const timer = setTimeout(() => {
        handleNext();
      }, currentStepData.action.duration || 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentStepData, open]);

  const handleNext = () => {
    const newCompleted = new Set(completed);
    newCompleted.add(currentStepData.id);
    setCompleted(newCompleted);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (skipEnabled) {
      onClose();
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const renderTooltip = () => {
    if (!currentStepData.target || !targetElement || !tooltipAnchor) {
      return null;
    }

    const isLast = currentStep === steps.length - 1;
    
    return (
      <Popper
        open={open}
        anchorEl={tooltipAnchor}
        placement={currentStepData.position || 'bottom'}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 16],
            },
          },
        ]}
        style={{ zIndex: 10000 }}
      >
        <Fade in timeout={300}>
          <TooltipContainer>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              {currentStepData.icon && (
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                >
                  {currentStepData.icon}
                </Avatar>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {currentStepData.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {currentStepData.content}
                </Typography>
              </Box>
            </Box>

            {currentStepData.tips && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  💡 Tips:
                </Typography>
                {currentStepData.tips.map((tip, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5, pl: 1 }}
                  >
                    • {tip}
                  </Typography>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {currentStep + 1} of {steps.length}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStep > 0 && (
                  <Button
                    size="small"
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Back
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNext}
                  endIcon={isLast ? <CheckIcon /> : <NextIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  {isLast ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </Box>
          </TooltipContainer>
        </Fade>
      </Popper>
    );
  };

  const renderWalkthroughDialog = () => {
    if (currentStepData.target) return null; // Show tooltip instead
    
    return (
      <Dialog
        open={open}
        onClose={handleSkip}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
          },
        }}
      >
        <OnboardingContainer>
          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
              {currentStepData.icon && (
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    animation: `${popIn} 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
                  }}
                >
                  {currentStepData.icon}
                </Avatar>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                  {currentStepData.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {currentStepData.content}
                </Typography>
              </Box>
            </Box>

            {currentStepData.tips && (
              <StepCard sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TipIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Pro Tips
                    </Typography>
                  </Box>
                  {currentStepData.tips.map((tip, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        display: 'block', 
                        mb: 1,
                        pl: 2,
                        position: 'relative',
                        '&::before': {
                          content: '"✓"',
                          position: 'absolute',
                          left: 0,
                          color: 'success.main',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      {tip}
                    </Typography>
                  ))}
                </CardContent>
              </StepCard>
            )}

            {/* Progress indicator */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: index <= currentStep 
                        ? 'primary.main' 
                        : alpha(theme.palette.primary.main, 0.2),
                      transition: 'all 0.3s ease-in-out',
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Step {currentStep + 1} of {steps.length}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
            <Button
              onClick={handleSkip}
              disabled={!skipEnabled}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              {skipEnabled ? 'Skip Tour' : 'Close'}
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  startIcon={<BackIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
              )}
              
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={currentStep === steps.length - 1 ? <CheckIcon /> : <NextIcon />}
                sx={{ textTransform: 'none' }}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </Box>
          </DialogActions>
        </OnboardingContainer>
      </Dialog>
    );
  };

  if (!open) return null;

  return (
    <>
      {/* Dark overlay for target highlighting */}
      {targetElement && (
        <>
          <HighlightOverlay
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <TargetHighlight
            style={{
              top: targetElement.offsetTop - 8,
              left: targetElement.offsetLeft - 8,
              width: targetElement.offsetWidth + 16,
              height: targetElement.offsetHeight + 16,
            }}
          />
        </>
      )}

      {/* Tooltip or dialog */}
      {currentStepData.target ? renderTooltip() : renderWalkthroughDialog()}
    </>
  );
};

export default NotificationOnboarding;
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Public API service for shared work orders
const publicShareService = {
  async getSharedWorkOrder(shareToken: string) {
    const response = await fetch(`/api/public/share/${shareToken}`);
    if (!response.ok) {
      throw new Error('Failed to load shared work order');
    }
    return response.json();
  },

  async addComment(shareToken: string, content: string, authorName?: string, authorEmail?: string) {
    const response = await fetch(`/api/public/share/${shareToken}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        authorName: authorName || null,
        authorEmail: authorEmail || null,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }
    
    return response.json();
  },

  async getComments(shareToken: string, status: string = 'APPROVED') {
    const response = await fetch(`/api/public/share/${shareToken}/comments?status=${status}`);
    if (!response.ok) {
      throw new Error('Failed to load comments');
    }
    return response.json();
  },
};

export default function PublicWorkOrderShare() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Fetch shared work order data
  const { data: shareData, isLoading, error, refetch } = useQuery({
    queryKey: ['public-share', shareToken],
    queryFn: () => {
      if (!shareToken) throw new Error('Share token is required');
      return publicShareService.getSharedWorkOrder(shareToken);
    },
    enabled: !!shareToken,
    retry: 1,
  });

  // Fetch comments
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['public-comments', shareToken],
    queryFn: () => {
      if (!shareToken) throw new Error('Share token is required');
      return publicShareService.getComments(shareToken, 'APPROVED');
    },
    enabled: !!shareToken && shareData?.share?.allowComments,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ content, authorName, authorEmail }: { content: string; authorName?: string; authorEmail?: string }) => {
      if (!shareToken) throw new Error('Share token is required');
      return publicShareService.addComment(shareToken, content, authorName, authorEmail);
    },
    onSuccess: () => {
      setComment('');
      setShowCommentForm(false);
      refetchComments();
    },
  });

  const handleAddComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate({
        content: comment.trim(),
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'ON_HOLD':
        return 'warning';
      case 'OPEN':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'Failed to load work order'}
          </Alert>
          <Button variant="outlined" onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!shareData || !shareData.workOrder) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="warning">
            This work order share link is invalid or has expired.
          </Alert>
        </Paper>
      </Container>
    );
  }

  const { workOrder, share } = shareData;
  const comments = commentsData?.comments || [];

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <WorkOrderIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Work Order #{workOrder.id}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {workOrder.title}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={workOrder.status}
            sx={{ 
              bgcolor: 'background.paper', 
              color: `${getStatusColor(workOrder.status)}.main`,
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={workOrder.priority}
            sx={{ 
              bgcolor: 'background.paper', 
              color: `${getPriorityColor(workOrder.priority)}.main`,
              fontWeight: 'bold'
            }}
          />
          {workOrder.totalLoggedHours > 0 && (
            <Chip
              icon={<TimeIcon />}
              label={`${workOrder.totalLoggedHours}h logged`}
              sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
            />
          )}
        </Box>
      </Paper>

      {/* Work Order Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
          {workOrder.description || 'No description provided.'}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Details
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <FlagIcon />
            </ListItemIcon>
            <ListItemText
              primary="Status"
              secondary={workOrder.status}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <FlagIcon />
            </ListItemIcon>
            <ListItemText
              primary="Priority"
              secondary={workOrder.priority}
            />
          </ListItem>

          {workOrder.assignedTo && (
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="Assigned To"
                secondary={workOrder.assignedTo.name}
              />
            </ListItem>
          )}

          {workOrder.asset && (
            <ListItem>
              <ListItemIcon>
                <AssetIcon />
              </ListItemIcon>
              <ListItemText
                primary="Asset"
                secondary={workOrder.asset.name}
              />
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText
              primary="Created"
              secondary={new Date(workOrder.createdAt).toLocaleDateString()}
            />
          </ListItem>

          {workOrder.totalLoggedHours > 0 && (
            <ListItem>
              <ListItemIcon>
                <TimeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Time Logged"
                secondary={`${workOrder.totalLoggedHours} hours`}
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Comments Section */}
      {share.allowComments && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CommentIcon />
              Comments ({comments.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<CommentIcon />}
              onClick={() => setShowCommentForm(!showCommentForm)}
              disabled={addCommentMutation.isPending}
            >
              Add Comment
            </Button>
          </Box>

          {/* Comment Form */}
          {showCommentForm && (
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Add Your Comment
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Your Name (Optional)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Email (Optional)"
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    helperText="For notifications only"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Your comment"
                  multiline
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts, questions, or updates..."
                  sx={{ mb: 2 }}
                />
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Comments are moderated and will be reviewed before appearing publicly.
                </Alert>
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setShowCommentForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    startIcon={addCommentMutation.isPending ? <CircularProgress size={16} /> : <SendIcon />}
                  >
                    {addCommentMutation.isPending ? 'Submitting...' : 'Submit Comment'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <CommentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="body1">
                No comments yet. Be the first to share your thoughts!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {comments.map((commentItem: any) => (
                <Card key={commentItem.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main',
                          fontSize: '0.875rem',
                        }}
                      >
                        {commentItem.authorName 
                          ? commentItem.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                          : '?'
                        }
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {commentItem.authorName || 'Anonymous'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(commentItem.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {commentItem.content}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {addCommentMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Thank you! Your comment has been submitted and is pending review.
            </Alert>
          )}

          {addCommentMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {addCommentMutation.error instanceof Error 
                ? addCommentMutation.error.message 
                : 'Failed to submit comment. Please try again.'}
            </Alert>
          )}
        </Paper>
      )}

      {/* Footer */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          This is a shared view of work order #{workOrder.id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {share.currentViews} view{share.currentViews === 1 ? '' : 's'}
          {share.expiresAt && (
            <> • Expires {new Date(share.expiresAt).toLocaleDateString()}</>
          )}
        </Typography>
      </Paper>

      {/* Floating Action Button for Comments */}
      {share.allowComments && !showCommentForm && isMobile && (
        <Fab
          color="primary"
          aria-label="add comment"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowCommentForm(true)}
        >
          <CommentIcon />
        </Fab>
      )}
    </Container>
  );
}
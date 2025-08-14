// Public Portal Page - Public-facing portal for external submissions
import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container, Alert } from '@mui/material';
import PublicPortalForm from '../components/Portal/PublicPortalForm';

const PublicPortalPage: React.FC = () => {
  const { portalSlug } = useParams<{ portalSlug: string }>();
  const [searchParams] = useSearchParams();
  
  // QR code tracking
  const qrCode = searchParams.get('qr');
  const ref = searchParams.get('ref');

  // Validate portal slug
  if (!portalSlug) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          Invalid portal URL. Please check the link and try again.
        </Alert>
      </Container>
    );
  }

  // Track QR code or referral usage
  useEffect(() => {
    if (qrCode || ref) {
      // Track the source of the visit for analytics
      console.debug('Portal accessed via:', qrCode ? 'QR Code' : 'Referral', qrCode || ref);
    }
  }, [qrCode, ref]);

  const handleSubmissionSuccess = (submissionId: string, trackingCode: string) => {
    // Optional: redirect to a thank you page or tracking page
    console.log('Submission successful:', { submissionId, trackingCode });
    
    // You could redirect to a tracking page:
    // window.location.href = `/track/${trackingCode}`;
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>Submit Request - Maintenance Portal</title>
      <meta name="description" content="Submit maintenance requests and facility issues through our secure portal." />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="robots" content="noindex, nofollow" />
      
      {/* Mobile-optimized styles */}
      <style>{`
        body {
          margin: 0;
          padding: 0;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Prevent zoom on input focus for iOS */
        input, select, textarea {
          font-size: 16px !important;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar for better mobile experience */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>

      <PublicPortalForm
        portalSlug={portalSlug}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </>
  );
};

export default PublicPortalPage;
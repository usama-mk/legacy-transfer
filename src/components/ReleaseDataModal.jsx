import { useState, useEffect } from 'react';
import { getAllPages, getTrustees } from '../utils/storage';
import { decryptData } from '../utils/crypto';

const CATEGORY_NAMES = {
  'digital-accounts': 'Digital Accounts',
  'financial-assets': 'Financial Assets',
  'key-contacts': 'Key Contacts',
  'end-of-life-wishes': 'End-of-Life Wishes'
};

function ReleaseDataModal({ masterKey, onClose }) {
  const [loading, setLoading] = useState(true);
  const [formattedData, setFormattedData] = useState('');
  const [trustees, setTrustees] = useState([]);

  useEffect(() => {
    loadAndFormatData();
  }, []);

  const loadAndFormatData = async () => {
    setLoading(true);
    try {
      // Get all pages
      const allPages = await getAllPages();
      
      // Get trustees
      const allTrustees = await getTrustees();
      setTrustees(allTrustees);

      // Group pages by category
      const pagesByCategory = {};
      for (const page of allPages) {
        if (!pagesByCategory[page.category]) {
          pagesByCategory[page.category] = [];
        }
        pagesByCategory[page.category].push(page);
      }

      // Decrypt and format data
      let formatted = 'LEGACY ORGANIZER - INFORMATION RELEASE\n';
      formatted += '='.repeat(50) + '\n\n';
      formatted += `Release Date: ${new Date().toLocaleString()}\n`;
      formatted += `This information has been released to trustees as requested.\n\n`;
      formatted += '='.repeat(50) + '\n\n';

      // Format each category
      for (const [category, pages] of Object.entries(pagesByCategory)) {
        const categoryName = CATEGORY_NAMES[category] || category;
        formatted += `\n${categoryName.toUpperCase()}\n`;
        formatted += '-'.repeat(50) + '\n\n';

        for (const page of pages) {
          try {
            const decrypted = await decryptData(
              masterKey,
              page.encryptedBlob,
              page.iv
            );

            // Format entry based on category
            let entryFormatted = '';
            for (const [key, value] of Object.entries(decrypted)) {
              if (value) {
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                
                // Handle multi-line values (like notes, descriptions)
                if (typeof value === 'string' && value.includes('\n')) {
                  entryFormatted += `${label}:\n${value}\n\n`;
                } else {
                  entryFormatted += `${label}: ${value}\n`;
                }
              }
            }
            formatted += entryFormatted;
            formatted += '-'.repeat(30) + '\n\n';
          } catch (err) {
            console.error('Error decrypting page:', page.id, err);
            formatted += `[Error decrypting entry]\n\n`;
          }
        }
      }

      formatted += '\n' + '='.repeat(50) + '\n';
      formatted += 'END OF INFORMATION RELEASE\n';

      setFormattedData(formatted);
    } catch (err) {
      console.error('Error loading data:', err);
      setFormattedData('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedData).then(() => {
      alert('Data copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const handleDownload = () => {
    const blob = new Blob([formattedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legacy-information-release-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    if (trustees.length === 0) {
      alert('No trustees found. Please add trustees first.');
      return;
    }

    const subject = encodeURIComponent('Legacy Organizer - Information Release');
    const body = encodeURIComponent(
      `Dear Trustee(s),\n\n` +
      `This email contains the released information from Legacy Organizer.\n\n` +
      `Please find the information attached or in the email body below.\n\n` +
      `---\n\n` +
      formattedData +
      `\n\n---\n\n` +
      `This information was released on ${new Date().toLocaleString()}.\n\n` +
      `Please keep this information secure and confidential.\n\n` +
      `Best regards,\n` +
      `Legacy Organizer`
    );

    // Create mailto link with all trustee emails
    const trusteeEmails = trustees.map(t => t.email).join(',');
    const mailtoLink = `mailto:${trusteeEmails}?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Decrypting and formatting data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content release-data-modal">
        <div className="modal-header">
          <h2>Information Release</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="release-data-info">
          <p>
            <strong>All information has been decrypted and formatted.</strong>
            <br />
            Use the options below to share this information with your trustees.
          </p>
          {trustees.length > 0 && (
            <p className="trustees-list">
              <strong>Trustees to notify:</strong> {trustees.map(t => t.name).join(', ')}
            </p>
          )}
        </div>

        <div className="release-data-actions">
          <button onClick={handleCopy} className="btn-secondary">
            📋 Copy to Clipboard
          </button>
          <button onClick={handleDownload} className="btn-secondary">
            💾 Download as File
          </button>
          <button 
            onClick={handleEmail} 
            className="btn-primary"
            disabled={trustees.length === 0}
          >
            📧 Email to Trustees
          </button>
        </div>

        {trustees.length === 0 && (
          <div className="release-warning">
            <p>
              <strong>⚠️ No Trustees Found</strong>
              <br />
              Please add trustees first before using the email option. You can still copy or download the data.
            </p>
          </div>
        )}

        <div className="release-data-content">
          <h3>Formatted Information:</h3>
          <div className="data-preview">
            <pre>{formattedData}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseDataModal;


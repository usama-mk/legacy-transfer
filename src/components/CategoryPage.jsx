import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { encryptData, decryptData } from '../utils/crypto';
import {
  getAllPages,
  savePage,
  deletePage,
  generatePageId
} from '../utils/storage';

const CATEGORY_NAMES = {
  'digital-accounts': 'Digital Accounts',
  'financial-assets': 'Financial Assets',
  'key-contacts': 'Key Contacts',
  'end-of-life-wishes': 'End-of-Life Wishes'
};

const CATEGORY_FIELDS = {
  'digital-accounts': [
    { 
      key: 'service', 
      label: 'Service/Platform Name', 
      type: 'text',
      placeholder: 'e.g., Gmail, Facebook, Netflix, Amazon',
      helpText: 'The name of the website or service'
    },
    { 
      key: 'username', 
      label: 'Username or Email', 
      type: 'text',
      placeholder: 'Your login email or username',
      helpText: 'The email address or username you use to log in'
    },
    { 
      key: 'password', 
      label: 'Password', 
      type: 'password',
      placeholder: 'Your password (will be encrypted)',
      helpText: 'Store your password securely - it will be encrypted'
    },
    { 
      key: 'recoveryEmail', 
      label: 'Recovery Email (if different)', 
      type: 'text',
      placeholder: 'Optional: recovery email address',
      helpText: 'If you use a different email for account recovery'
    },
    { 
      key: 'twoFactor', 
      label: 'Two-Factor Authentication Info', 
      type: 'text',
      placeholder: 'e.g., Authenticator app, backup codes location',
      helpText: 'How to access 2FA if enabled'
    },
    { 
      key: 'notes', 
      label: 'Additional Notes', 
      type: 'textarea',
      placeholder: 'Any other important information about this account',
      helpText: 'Security questions, special instructions, or other relevant details'
    }
  ],
  'financial-assets': [
    { 
      key: 'institution', 
      label: 'Financial Institution', 
      type: 'text',
      placeholder: 'e.g., Bank of America, Fidelity, State Farm',
      helpText: 'The name of the bank, investment firm, or insurance company'
    },
    { 
      key: 'accountType', 
      label: 'Account Type', 
      type: 'text',
      placeholder: 'e.g., Checking, Savings, 401(k), Life Insurance',
      helpText: 'Type of account or policy'
    },
    { 
      key: 'accountNumber', 
      label: 'Account/Policy Number', 
      type: 'text',
      placeholder: 'Last 4 digits or full number',
      helpText: 'Account number (you can use last 4 digits for security)'
    },
    { 
      key: 'contactInfo', 
      label: 'Institution Contact', 
      type: 'text',
      placeholder: 'Phone number or website for customer service',
      helpText: 'How to contact the institution if needed'
    },
    { 
      key: 'beneficiary', 
      label: 'Beneficiary Information', 
      type: 'text',
      placeholder: 'Who is the beneficiary?',
      helpText: 'Name of beneficiary if applicable'
    },
    { 
      key: 'notes', 
      label: 'Additional Notes', 
      type: 'textarea',
      placeholder: 'Any other important financial information',
      helpText: 'Routing numbers, account access instructions, or other relevant details'
    }
  ],
  'key-contacts': [
    { 
      key: 'name', 
      label: 'Full Name', 
      type: 'text',
      placeholder: 'First and last name',
      helpText: 'Full name of the contact'
    },
    { 
      key: 'relationship', 
      label: 'Relationship/Role', 
      type: 'text',
      placeholder: 'e.g., Attorney, Accountant, Financial Advisor, Family Friend',
      helpText: 'Their relationship to you or their professional role'
    },
    { 
      key: 'email', 
      label: 'Email Address', 
      type: 'email',
      placeholder: 'email@example.com',
      helpText: 'Primary email address'
    },
    { 
      key: 'phone', 
      label: 'Phone Number', 
      type: 'tel',
      placeholder: '(555) 123-4567',
      helpText: 'Primary phone number'
    },
    { 
      key: 'alternatePhone', 
      label: 'Alternate Phone (Optional)', 
      type: 'tel',
      placeholder: 'Mobile, office, or other number',
      helpText: 'Additional contact number if available'
    },
    { 
      key: 'address', 
      label: 'Business Address', 
      type: 'textarea',
      placeholder: 'Street address, city, state, zip',
      helpText: 'Office or business address if applicable'
    },
    { 
      key: 'notes', 
      label: 'Additional Notes', 
      type: 'textarea',
      placeholder: 'Best time to contact, special instructions, or other relevant information',
      helpText: 'Any other important information about this contact'
    }
  ],
  'end-of-life-wishes': [
    { 
      key: 'title', 
      label: 'Title/Subject', 
      type: 'text',
      placeholder: 'e.g., Healthcare Directive, Funeral Preferences, Will Location',
      helpText: 'A brief title for this wish or directive'
    },
    { 
      key: 'description', 
      label: 'Description/Details', 
      type: 'textarea',
      placeholder: 'Describe your wishes, preferences, or instructions in detail',
      helpText: 'Full description of your wishes or what this document contains'
    },
    { 
      key: 'location', 
      label: 'Document Location', 
      type: 'text',
      placeholder: 'e.g., Safe deposit box #123, Home office filing cabinet, Attorney\'s office',
      helpText: 'Where the physical document is stored, if applicable'
    },
    { 
      key: 'accessInfo', 
      label: 'How to Access', 
      type: 'text',
      placeholder: 'e.g., Key location, Safe combination, Attorney contact',
      helpText: 'Instructions on how to access the document or information'
    },
    { 
      key: 'notes', 
      label: 'Additional Notes', 
      type: 'textarea',
      placeholder: 'Any other relevant information or special instructions',
      helpText: 'Additional context or instructions related to this wish or document'
    }
  ]
};

function CategoryPage({ masterKey }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState('');

  const fields = CATEGORY_FIELDS[categoryId] || [];

  useEffect(() => {
    if (masterKey) {
      loadEntries();
    }
  }, [masterKey, categoryId]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const allPages = await getAllPages();
      const categoryPages = allPages.filter(
        (page) => page.category === categoryId
      );

      // Decrypt all entries
      const decryptedEntries = await Promise.all(
        categoryPages.map(async (page) => {
          try {
            const decrypted = await decryptData(
              masterKey,
              page.encryptedBlob,
              page.iv
            );
            return {
              id: page.id,
              ...decrypted,
              lastModified: page.lastModified
            };
          } catch (err) {
            console.error('Decryption error for page:', page.id, err);
            return null;
          }
        })
      );

      setEntries(decryptedEntries.filter((e) => e !== null));
    } catch (err) {
      console.error('Error loading entries:', err);
      showNotification('Error loading entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      const pageId = editingId || generatePageId();
      const encrypted = await encryptData(masterKey, formData);

      await savePage(
        pageId,
        categoryId,
        encrypted.cipherText,
        encrypted.iv,
        Date.now()
      );

      showNotification('Data encrypted and saved locally');
      setFormData({});
      setShowAddForm(false);
      setEditingId(null);
      loadEntries();
    } catch (err) {
      console.error('Error saving entry:', err);
      showNotification('Error saving entry', 'error');
    }
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setShowAddForm(true);
  };

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deletePage(entryId);
        showNotification('Entry deleted');
        loadEntries();
      } catch (err) {
        console.error('Error deleting entry:', err);
        showNotification('Error deleting entry', 'error');
      }
    }
  };

  const handleCancel = () => {
    setFormData({});
    setShowAddForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="category-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back to Dashboard
        </button>
        <div>
          <h1>{CATEGORY_NAMES[categoryId] || categoryId}</h1>
          <p className="category-intro">
            Fill out the form below to securely store information. Each entry is encrypted and saved locally. 
            This is your one-page-per-category organizer for critical life information.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.includes('Error') ? 'error' : 'success'}`}>
          {notification}
        </div>
      )}

      {!showAddForm ? (
        <>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            + Add New Entry
          </button>

          <div className="entries-list">
            {entries.length === 0 ? (
              <div className="empty-state">
                <p><strong>No entries yet.</strong></p>
                <p>Click "Add New Entry" below to start organizing your {CATEGORY_NAMES[categoryId]?.toLowerCase()} information.</p>
                <p className="empty-state-hint">
                  All information is encrypted and stored securely in your browser. Only you can access it with your master password.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-content">
                    {fields.map((field) => {
                      const value = entry[field.key];
                      if (!value) return null;
                      return (
                        <div key={field.key} className="entry-field">
                          <strong>{field.label}:</strong>
                          {field.type === 'textarea' ? (
                            <p>{value}</p>
                          ) : (
                            <span>{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="entry-actions">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="entry-form">
          <h2>{editingId ? 'Edit Entry' : 'Add New Entry'}</h2>
          <p className="form-intro">
            Fill out the fields below. All information will be encrypted and saved securely.
          </p>
          {fields.map((field) => (
            <div key={field.key} className="form-group">
              <label htmlFor={field.key}>
                {field.label}
                {field.helpText && (
                  <span className="help-text"> ({field.helpText})</span>
                )}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  rows={4}
                />
              ) : (
                <input
                  type={field.type}
                  id={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                />
              )}
            </div>
          ))}
          <div className="form-actions">
            <button onClick={handleSave} className="btn-primary">
              Save
            </button>
            <button onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;


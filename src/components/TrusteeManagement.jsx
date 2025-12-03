import { useState, useEffect } from 'react';
import { getTrustees, saveTrustee, deleteTrustee } from '../utils/storage';
import { generatePageId } from '../utils/storage';

function TrusteeManagement({ masterKey, onClose }) {
  const [trustees, setTrustees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadTrustees();
  }, []);

  const loadTrustees = async () => {
    setLoading(true);
    try {
      const allTrustees = await getTrustees();
      setTrustees(allTrustees);
    } catch (err) {
      console.error('Error loading trustees:', err);
      showNotification('Error loading trustees', 'error');
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
    if (!formData.name || !formData.email) {
      showNotification('Name and email are required', 'error');
      return;
    }

    try {
      const trusteeId = editingId || generatePageId();
      const trustee = {
        id: trusteeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        relationship: formData.relationship || '',
        addedDate: editingId ? trustees.find(t => t.id === editingId)?.addedDate || Date.now() : Date.now()
      };

      await saveTrustee(trustee);
      showNotification(editingId ? 'Trustee updated' : 'Trustee added');
      setFormData({ name: '', email: '', phone: '', relationship: '' });
      setShowAddForm(false);
      setEditingId(null);
      loadTrustees();
    } catch (err) {
      console.error('Error saving trustee:', err);
      showNotification('Error saving trustee', 'error');
    }
  };

  const handleEdit = (trustee) => {
    setFormData({
      name: trustee.name,
      email: trustee.email,
      phone: trustee.phone || '',
      relationship: trustee.relationship || ''
    });
    setEditingId(trustee.id);
    setShowAddForm(true);
  };

  const handleDelete = async (trusteeId) => {
    if (window.confirm('Are you sure you want to remove this trustee? They will no longer be able to verify your status.')) {
      try {
        await deleteTrustee(trusteeId);
        showNotification('Trustee removed');
        loadTrustees();
      } catch (err) {
        console.error('Error deleting trustee:', err);
        showNotification('Error removing trustee', 'error');
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', relationship: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content trustee-modal">
        <div className="modal-header">
          <h2>Trustee Management</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        {notification && (
          <div className={`notification ${notification.includes('Error') ? 'error' : 'success'}`}>
            {notification}
          </div>
        )}

        <div className="trustee-info">
          <p>
            <strong>What are Trustees?</strong>
            <br />
            Trustees are trusted contacts who can verify your status and access your information when release conditions are met. 
            You can designate 1-2 trustees who will be notified if you don't log in for the specified period.
          </p>
        </div>

        {!showAddForm ? (
          <>
            <div className="trustee-actions">
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
                disabled={trustees.length >= 2}
              >
                + Add Trustee
              </button>
              {trustees.length >= 2 && (
                <p className="info-text">Maximum of 2 trustees allowed</p>
              )}
            </div>

            <div className="trustees-list">
              {trustees.length === 0 ? (
                <div className="empty-state">
                  <p><strong>No trustees added yet.</strong></p>
                  <p>Add trusted contacts who can verify your status and access information when conditions are met.</p>
                </div>
              ) : (
                trustees.map((trustee) => (
                  <div key={trustee.id} className="trustee-card">
                    <div className="trustee-content">
                      <h3>{trustee.name}</h3>
                      <div className="trustee-details">
                        <p><strong>Email:</strong> {trustee.email}</p>
                        {trustee.phone && <p><strong>Phone:</strong> {trustee.phone}</p>}
                        {trustee.relationship && <p><strong>Relationship:</strong> {trustee.relationship}</p>}
                        <p className="trustee-date">
                          Added: {new Date(trustee.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="trustee-actions-card">
                      <button
                        onClick={() => handleEdit(trustee)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trustee.id)}
                        className="btn-delete"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="trustee-form">
            <h3>{editingId ? 'Edit Trustee' : 'Add New Trustee'}</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Trustee's full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="trustee@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="form-group">
              <label htmlFor="relationship">Relationship</label>
              <input
                type="text"
                id="relationship"
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                placeholder="e.g., Family member, Close friend, Attorney"
              />
            </div>
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
    </div>
  );
}

export default TrusteeManagement;


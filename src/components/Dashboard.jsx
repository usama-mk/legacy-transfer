import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'digital-accounts',
    name: 'Digital Accounts',
    icon: '💻',
    description: 'Store passwords, usernames, and access details for all your online accounts and digital services',
    guidance: 'Include email accounts, social media, cloud storage, subscription services, and any platform requiring login credentials.'
  },
  {
    id: 'financial-assets',
    name: 'Financial Assets',
    icon: '💰',
    description: 'Organize bank accounts, investments, insurance policies, and critical financial information',
    guidance: 'Document account numbers, institutions, policy numbers, and key financial details your family may need to access.'
  },
  {
    id: 'key-contacts',
    name: 'Key Contacts',
    icon: '📞',
    description: 'Keep contact information for lawyers, accountants, financial advisors, and other important people',
    guidance: 'Include professionals and trusted individuals who may need to be contacted during emergencies or life transitions.'
  },
  {
    id: 'end-of-life-wishes',
    name: 'End-of-Life Wishes',
    icon: '📜',
    description: 'Document your final wishes, directives, and locations of important legal documents',
    guidance: 'Store information about healthcare directives, funeral preferences, document locations, and any specific wishes you want honored.'
  }
];

function Dashboard({ onBackup, onImport, onTrustees, onReleaseConditions }) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Legacy Organizer</h1>
          <p className="dashboard-subtitle">
            Your secure, one-page-per-category tool to organize critical life information
          </p>
        </div>
        <div className="dashboard-actions">
          <button onClick={onBackup} className="btn-secondary">
            📥 Backup/Export
          </button>
          <button onClick={onImport} className="btn-secondary">
            📤 Import Backup
          </button>
        </div>
      </div>

      <div className="welcome-message">
        <p>
          <strong>Welcome to Legacy Organizer</strong>
          <br />
          Fill out simple, guided forms for each category below. All data is encrypted and stored locally in your browser. 
          This is your single source of truth for critical, non-legal information that your family may need.
        </p>
      </div>

      <div className="security-features">
        <div className="security-card">
          <div className="security-icon">👥</div>
          <div className="security-content">
            <h3>Trustee Management</h3>
            <p>Designate trusted contacts who can verify your status and access information when conditions are met.</p>
            <button onClick={onTrustees} className="btn-primary">
              Manage Trustees
            </button>
          </div>
        </div>
        <div className="security-card">
          <div className="security-icon">🔓</div>
          <div className="security-content">
            <h3>Release Conditions</h3>
            <p>Configure inactivity periods and trustee requirements for information release.</p>
            <button onClick={onReleaseConditions} className="btn-primary">
              Configure Release
            </button>
          </div>
        </div>
      </div>

      <div className="categories-grid">
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <h2>{category.name}</h2>
            <p className="category-description">{category.description}</p>
            <p className="category-guidance">{category.guidance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;


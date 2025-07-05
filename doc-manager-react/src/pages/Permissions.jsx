import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './Permissions.css';
import Layout from '../components/Layout';

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRolePermissionOpen, setIsRolePermissionOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: '',
    action: ''
  });
  const [errors, setErrors] = useState({});

  const moduleOptions = [
    'User Management',
    'Document Management',
    'Role Management',
    'System Settings',
    'Reports',
    'Dashboard',
    'File Upload',
    'Communication',
    'Audit Logs',
    'Security'
  ];

  const actionOptions = [
    'Create',
    'Read',
    'Update',
    'Delete',
    'View',
    'Export',
    'Import',
    'Share',
    'Approve',
    'Reject'
  ];

  // Load data on component mount
  useEffect(() => {
    loadPermissions();
    loadRolePermissions();
    loadAssignedRoles();
  }, []);

  const loadPermissions = () => {
    try {
      const stored = localStorage.getItem('permissions');
      const perms = stored ? JSON.parse(stored) : [];
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    }
  };

  const loadRolePermissions = () => {
    try {
      const stored = localStorage.getItem('rolePermissions');
      const rolePerms = stored ? JSON.parse(stored) : [];
      setRolePermissions(rolePerms);
    } catch (error) {
      console.error('Error loading role permissions:', error);
      setRolePermissions([]);
    }
  };

  const loadAssignedRoles = () => {
    try {
      const stored = localStorage.getItem('assignedRoles');
      const roles = stored ? JSON.parse(stored) : [];
      setAssignedRoles(roles);
    } catch (error) {
      console.error('Error loading assigned roles:', error);
      setAssignedRoles([]);
    }
  };

  const savePermissions = (newPermissions) => {
    try {
      localStorage.setItem('permissions', JSON.stringify(newPermissions));
      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  const saveRolePermissions = (newRolePermissions) => {
    try {
      localStorage.setItem('rolePermissions', JSON.stringify(newRolePermissions));
      setRolePermissions(newRolePermissions);
    } catch (error) {
      console.error('Error saving role permissions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Permission name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.module) {
      newErrors.module = 'Module selection is required';
    }

    if (!formData.action) {
      newErrors.action = 'Action selection is required';
    }

    // Check for duplicate permission
    const duplicate = permissions.find(p => 
      p.name.toLowerCase() === formData.name.toLowerCase() ||
      (p.module === formData.module && p.action === formData.action)
    );

    if (duplicate) {
      newErrors.name = 'Permission with this name or module-action combination already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const newPermission = {
        id: Date.now() + Math.random(),
        name: formData.name,
        description: formData.description,
        module: formData.module,
        action: formData.action,
        createdDate: new Date().toISOString().split('T')[0]
      };

      const updatedPermissions = [...permissions, newPermission];
      savePermissions(updatedPermissions);

      setFormData({
        name: '',
        description: '',
        module: '',
        action: ''
      });

      setIsFormOpen(false);
      Swal.fire('Success!', 'Permission created successfully!', 'success');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      module: '',
      action: ''
    });
    setErrors({});
    setIsFormOpen(false);
  };

  const deletePermission = (permissionId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the permission and remove it from all roles.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        try {
          // Remove permission
          const updatedPermissions = permissions.filter(p => p.id !== permissionId);
          savePermissions(updatedPermissions);

          // Remove from all role permissions
          const updatedRolePermissions = rolePermissions.map(rp => ({
            ...rp,
            permissions: rp.permissions.filter(p => p !== permissionId)
          }));
          saveRolePermissions(updatedRolePermissions);

          Swal.fire('Deleted!', 'Permission has been deleted.', 'success');
        } catch (error) {
          console.error('Error deleting permission:', error);
          Swal.fire('Error', 'Failed to delete permission', 'error');
        }
      }
    });
  };

  const openRolePermissions = (role) => {
    setSelectedRole(role);
    setIsRolePermissionOpen(true);
  };

  const toggleRolePermission = (roleId, permissionId) => {
    const existingRolePermission = rolePermissions.find(rp => rp.roleId === roleId);
    
    if (existingRolePermission) {
      // Update existing role permissions
      const updatedRolePermissions = rolePermissions.map(rp => {
        if (rp.roleId === roleId) {
          const hasPermission = rp.permissions.includes(permissionId);
          return {
            ...rp,
            permissions: hasPermission 
              ? rp.permissions.filter(p => p !== permissionId)
              : [...rp.permissions, permissionId]
          };
        }
        return rp;
      });
      saveRolePermissions(updatedRolePermissions);
    } else {
      // Create new role permission
      const newRolePermission = {
        id: Date.now() + Math.random(),
        roleId: roleId,
        permissions: [permissionId],
        createdDate: new Date().toISOString().split('T')[0]
      };
      const updatedRolePermissions = [...rolePermissions, newRolePermission];
      saveRolePermissions(updatedRolePermissions);
    }
  };

  const hasPermission = (roleId, permissionId) => {
    const rolePermission = rolePermissions.find(rp => rp.roleId === roleId);
    return rolePermission ? rolePermission.permissions.includes(permissionId) : false;
  };

  const getRolePermissions = (roleId) => {
    const rolePermission = rolePermissions.find(rp => rp.roleId === roleId);
    if (!rolePermission) return [];
    
    return permissions.filter(p => rolePermission.permissions.includes(p.id));
  };

  const getPermissionsByModule = () => {
    const grouped = {};
    permissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  };

  return (
    <Layout>
      <div className="permissions-container">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="header-section">
            <div className="header-left">
              <div className="header-icon">
                <span className="text-white text-2xl font-bold">🔐</span>
              </div>
              <div className="header-title">
                <h1>Permissions Management</h1>
                <p>Manage system permissions and role assignments</p>
              </div>
            </div>
            <button onClick={() => setIsFormOpen(true)} className="create-btn">
              <span className="text-xl mr-2">➕</span>
              <span>Create Permission</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#4CAF50' }}>
                <span>🔐</span>
              </div>
              <div className="stat-info">
                <h3>{permissions.length}</h3>
                <p>Total Permissions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#2196F3' }}>
                <span>👥</span>
              </div>
              <div className="stat-info">
                <h3>{assignedRoles.length}</h3>
                <p>Roles with Permissions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FF9800' }}>
                <span>📊</span>
              </div>
              <div className="stat-info">
                <h3>{moduleOptions.length}</h3>
                <p>System Modules</p>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="table-container">
            <div className="table-header">
              <h2><span className="mr-2">🔐</span>System Permissions</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="table-head">
                  <tr>
                    <th>Permission Name</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(permission => (
                    <tr key={permission.id} className="table-row">
                      <td className="font-medium">{permission.name}</td>
                      <td><span className="module-badge">{permission.module}</span></td>
                      <td><span className="action-badge">{permission.action}</span></td>
                      <td className="description-cell">{permission.description}</td>
                      <td>{permission.createdDate}</td>
                      <td>
                        <button
                          onClick={() => deletePermission(permission.id)}
                          className="delete-btn"
                          title="Delete Permission"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {permissions.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🔐</span>
                <p className="text-gray-500 text-lg">No permissions created yet</p>
                <p className="text-gray-400">Click "Create Permission" to add your first permission</p>
              </div>
            )}
          </div>

          {/* Role Permissions Table */}
          <div className="table-container">
            <div className="table-header">
              <h2><span className="mr-2">👥</span>Role Permissions</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="table-head">
                  <tr>
                    <th>Role</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Assigned Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRoles.map(role => (
                    <tr key={role.id} className="table-row">
                      <td><span className="role-badge">{role.role}</span></td>
                      <td>{role.firstName} {role.lastName}</td>
                      <td>{role.email}</td>
                      <td>
                        <div className="permissions-list">
                          {getRolePermissions(role.id).length > 0 ? (
                            getRolePermissions(role.id).map(perm => (
                              <span key={perm.id} className="permission-tag">
                                {perm.name}
                              </span>
                            ))
                          ) : (
                            <span className="no-permissions">No permissions assigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => openRolePermissions(role)}
                          className="manage-btn"
                          title="Manage Permissions"
                        >
                          ⚙️ Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {assignedRoles.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <p className="text-gray-500 text-lg">No roles found</p>
                <p className="text-gray-400">Create roles first to assign permissions</p>
              </div>
            )}
          </div>

          {/* Create Permission Modal */}
          {isFormOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Create New Permission</h3>
                  <button onClick={handleCancel} className="close-btn">
                    <span className="text-white text-xl">✕</span>
                  </button>
                </div>

                <div className="form-content">
                  <div className="form-group">
                    <label className="form-label">Permission Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter permission name"
                    />
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Module *</label>
                    <select
                      name="module"
                      value={formData.module}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select a module</option>
                      {moduleOptions.map(module => (
                        <option key={module} value={module}>{module}</option>
                      ))}
                    </select>
                    {errors.module && <p className="error-message">{errors.module}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Action *</label>
                    <select
                      name="action"
                      value={formData.action}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select an action</option>
                      {actionOptions.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                    {errors.action && <p className="error-message">{errors.action}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Enter permission description"
                      rows="4"
                    />
                    {errors.description && <p className="error-message">{errors.description}</p>}
                  </div>

                  <div className="form-buttons">
                    <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="btn-primary">Create Permission</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role Permission Management Modal */}
          {isRolePermissionOpen && selectedRole && (
            <div className="modal-overlay">
              <div className="modal-content large-modal">
                <div className="modal-header">
                  <h3 className="modal-title">
                    Manage Permissions for {selectedRole.firstName} {selectedRole.lastName} ({selectedRole.role})
                  </h3>
                  <button onClick={() => setIsRolePermissionOpen(false)} className="close-btn">
                    <span className="text-white text-xl">✕</span>
                  </button>
                </div>

                <div className="form-content">
                  <div className="permissions-grid">
                    {Object.entries(getPermissionsByModule()).map(([module, modulePermissions]) => (
                      <div key={module} className="module-section">
                        <h4 className="module-title">{module}</h4>
                        <div className="permissions-list">
                          {modulePermissions.map(permission => (
                            <div key={permission.id} className="permission-item">
                              <label className="permission-checkbox">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(selectedRole.id, permission.id)}
                                  onChange={() => toggleRolePermission(selectedRole.id, permission.id)}
                                />
                                <span className="checkmark"></span>
                                <div className="permission-info">
                                  <span className="permission-name">{permission.name}</span>
                                  <span className="permission-action">{permission.action}</span>
                                  <span className="permission-desc">{permission.description}</span>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {permissions.length === 0 && (
                    <div className="empty-state">
                      <span className="empty-icon">🔐</span>
                      <p className="text-gray-500">No permissions available</p>
                      <p className="text-gray-400">Create permissions first to assign them to roles</p>
                    </div>
                  )}

                  <div className="form-buttons">
                    <button
                      type="button"
                      onClick={() => setIsRolePermissionOpen(false)}
                      className="btn-primary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Permissions;
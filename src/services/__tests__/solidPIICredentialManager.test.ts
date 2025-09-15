/**
 * Tests for Solid Pod PII Credential Manager
 */

import SolidPIICredentialManager, { 
  PIIAccessLevel, 
  UserRole, 
  PIICredentialRequest 
} from '../solidPIICredentialManager';
import { Session } from '@inrupt/solid-client-authn-browser';

// Mock Solid client
jest.mock('@inrupt/solid-client', () => ({
  getSolidDataset: jest.fn(),
  saveSolidDatasetAt: jest.fn(),
  createSolidDataset: jest.fn().mockReturnValue({}),
  createThing: jest.fn().mockReturnValue({}),
  addStringNoLocale: jest.fn().mockReturnValue({}),
  addDatetime: jest.fn().mockReturnValue({}),
  addBoolean: jest.fn().mockReturnValue({}),
  getStringNoLocale: jest.fn(),
  getDatetime: jest.fn(),
  getBoolean: jest.fn(),
  getThing: jest.fn(),
  setThing: jest.fn().mockReturnValue({}),
  removeThing: jest.fn(),
  getThingAll: jest.fn().mockReturnValue([])
}));

// Mock session
const mockSession: Session = {
  info: {
    sessionId: 'test-session-id',
    isLoggedIn: true,
    webId: 'https://example.pod/profile/card#me'
  },
  fetch: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  handleIncomingRedirect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
} as any;

const mockPodUrl = 'https://example.pod';

describe('SolidPIICredentialManager', () => {
  let manager: SolidPIICredentialManager;

  beforeEach(() => {
    manager = new SolidPIICredentialManager(mockSession, mockPodUrl);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const { saveSolidDatasetAt } = require('@inrupt/solid-client');
      saveSolidDatasetAt.mockResolvedValueOnce(undefined);

      await expect(manager.initialize()).resolves.not.toThrow();
      expect(saveSolidDatasetAt).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const { saveSolidDatasetAt } = require('@inrupt/solid-client');
      saveSolidDatasetAt.mockRejectedValueOnce(new Error('Pod access denied'));

      await expect(manager.initialize()).rejects.toThrow('Pod access denied');
    });
  });

  describe('Credential Request Validation', () => {
    it('should validate basic credential request', async () => {
      const request: PIICredentialRequest = {
        userId: 'user123',
        role: UserRole.STAFF,
        requestedAccessLevel: PIIAccessLevel.BASIC,
        requestedPermissions: ['view_basic'],
        justification: 'Need access for case management',
        validityPeriod: 30
      };

      const { saveSolidDatasetAt } = require('@inrupt/solid-client');
      saveSolidDatasetAt.mockResolvedValueOnce(undefined);

      const credentialId = await manager.requestCredentials(request);
      expect(credentialId).toBeTruthy();
      expect(typeof credentialId).toBe('string');
    });

    it('should reject request with insufficient justification', async () => {
      const request: PIICredentialRequest = {
        userId: 'user123',
        role: UserRole.STAFF,
        requestedAccessLevel: PIIAccessLevel.BASIC,
        requestedPermissions: ['view_basic'],
        justification: 'short',
        validityPeriod: 30
      };

      await expect(manager.requestCredentials(request)).rejects.toThrow(
        'Invalid credential request: justification too short'
      );
    });

    it('should reject high-level access without supervisor approval', async () => {
      const request: PIICredentialRequest = {
        userId: 'user123',
        role: UserRole.STAFF,
        requestedAccessLevel: PIIAccessLevel.MEDICAL,
        requestedPermissions: ['view_medical'],
        justification: 'Need medical access for patient care',
        validityPeriod: 30
      };

      await expect(manager.requestCredentials(request)).rejects.toThrow(
        'Supervisor approval required for high-level PII access'
      );
    });

    it('should accept high-level access with supervisor approval', async () => {
      const request: PIICredentialRequest = {
        userId: 'user123',
        role: UserRole.MEDICAL_STAFF,
        requestedAccessLevel: PIIAccessLevel.MEDICAL,
        requestedPermissions: ['view_medical'],
        justification: 'Medical consultation required for patient care',
        validityPeriod: 30,
        supervisorApproval: 'supervisor@hospital.org'
      };

      const { saveSolidDatasetAt } = require('@inrupt/solid-client');
      saveSolidDatasetAt.mockResolvedValueOnce(undefined);

      const credentialId = await manager.requestCredentials(request);
      expect(credentialId).toBeTruthy();
    });

    it('should reject excessive validity period', async () => {
      const request: PIICredentialRequest = {
        userId: 'user123',
        role: UserRole.STAFF,
        requestedAccessLevel: PIIAccessLevel.BASIC,
        requestedPermissions: ['view_basic'],
        justification: 'Long term project access needed',
        validityPeriod: 365 // Too long
      };

      await expect(manager.requestCredentials(request)).rejects.toThrow(
        'Invalid credential request: validity period too long'
      );
    });
  });

  describe('Permission Management', () => {
    it('should assign correct permissions for guest role', () => {
      // This tests the private method indirectly through credential request
      const expectedPermissions = manager['getPermissionsForRole'](UserRole.GUEST, PIIAccessLevel.BASIC);
      expect(expectedPermissions).toContain('view_basic');
      expect(expectedPermissions).not.toContain('edit_all');
    });

    it('should assign correct permissions for staff role', () => {
      const expectedPermissions = manager['getPermissionsForRole'](UserRole.STAFF, PIIAccessLevel.BASIC);
      expect(expectedPermissions).toContain('view_basic');
      expect(expectedPermissions).toContain('edit_notes');
    });

    it('should assign correct permissions for administrator role', () => {
      const expectedPermissions = manager['getPermissionsForRole'](UserRole.ADMINISTRATOR, PIIAccessLevel.FULL);
      expect(expectedPermissions).toContain('view_all');
      expect(expectedPermissions).toContain('edit_all');
      expect(expectedPermissions).toContain('delete');
      expect(expectedPermissions).toContain('export');
    });
  });

  describe('MFA Requirements', () => {
    it('should require MFA for medical access', () => {
      const requiresMFA = manager['requiresMFAForLevel'](PIIAccessLevel.MEDICAL);
      expect(requiresMFA).toBe(true);
    });

    it('should require MFA for financial access', () => {
      const requiresMFA = manager['requiresMFAForLevel'](PIIAccessLevel.FINANCIAL);
      expect(requiresMFA).toBe(true);
    });

    it('should require MFA for full access', () => {
      const requiresMFA = manager['requiresMFAForLevel'](PIIAccessLevel.FULL);
      expect(requiresMFA).toBe(true);
    });

    it('should not require MFA for basic access', () => {
      const requiresMFA = manager['requiresMFAForLevel'](PIIAccessLevel.BASIC);
      expect(requiresMFA).toBe(false);
    });
  });

  describe('Access Restrictions', () => {
    it('should set time restrictions for guest users', () => {
      const restrictions = manager['getDefaultRestrictions'](UserRole.GUEST);
      expect(restrictions.timeRestrictions).toBeDefined();
      expect(restrictions.timeRestrictions?.startTime).toBe('08:00');
      expect(restrictions.timeRestrictions?.endTime).toBe('18:00');
      expect(restrictions.timeRestrictions?.daysOfWeek).toEqual([1, 2, 3, 4, 5]); // Weekdays only
      expect(restrictions.maxDailyAccess).toBe(5);
    });

    it('should set broader restrictions for staff users', () => {
      const restrictions = manager['getDefaultRestrictions'](UserRole.STAFF);
      expect(restrictions.maxDailyAccess).toBe(50);
      expect(restrictions.timeRestrictions).toBeUndefined(); // No time restrictions for staff
    });

    it('should set minimal restrictions for administrators', () => {
      const restrictions = manager['getDefaultRestrictions'](UserRole.ADMINISTRATOR);
      expect(Object.keys(restrictions).length).toBe(0); // No restrictions
    });
  });

  describe('Credential Validation', () => {
    it('should validate active credentials with correct permissions', async () => {
      // Mock credential retrieval
      const { getThing, getStringNoLocale, getDatetime, getBoolean } = require('@inrupt/solid-client');
      
      const mockThing = {};
      getThing.mockReturnValueOnce(mockThing);
      getStringNoLocale
        .mockReturnValueOnce('cred_123') // id
        .mockReturnValueOnce('user123') // userId
        .mockReturnValueOnce(UserRole.STAFF) // role
        .mockReturnValueOnce(PIIAccessLevel.BASIC) // accessLevel
        .mockReturnValueOnce(JSON.stringify(['view_basic', 'edit_notes'])); // permissions
      
      getDatetime
        .mockReturnValueOnce(new Date('2024-01-01')) // issuedAt
        .mockReturnValueOnce(new Date('2024-12-31')); // expiresAt (future)
      
      getBoolean
        .mockReturnValueOnce(true) // isActive
        .mockReturnValueOnce(false); // requiresMFA

      const isValid = await manager.validateCredentials('cred_123', 'client_456', 'view_client_basic');
      expect(isValid).toBe(true);
    });

    it('should reject expired credentials', async () => {
      const { getThing, getStringNoLocale, getDatetime, getBoolean } = require('@inrupt/solid-client');
      
      const mockThing = {};
      getThing.mockReturnValueOnce(mockThing);
      getStringNoLocale
        .mockReturnValueOnce('cred_123')
        .mockReturnValueOnce('user123')
        .mockReturnValueOnce(UserRole.STAFF)
        .mockReturnValueOnce(PIIAccessLevel.BASIC)
        .mockReturnValueOnce(JSON.stringify(['view_basic']));
      
      getDatetime
        .mockReturnValueOnce(new Date('2024-01-01'))
        .mockReturnValueOnce(new Date('2024-01-02')); // Expired
      
      getBoolean
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const isValid = await manager.validateCredentials('cred_123', 'client_456', 'view_client_basic');
      expect(isValid).toBe(false);
    });

    it('should reject inactive credentials', async () => {
      const { getThing, getStringNoLocale, getDatetime, getBoolean } = require('@inrupt/solid-client');
      
      const mockThing = {};
      getThing.mockReturnValueOnce(mockThing);
      getStringNoLocale
        .mockReturnValueOnce('cred_123')
        .mockReturnValueOnce('user123')
        .mockReturnValueOnce(UserRole.STAFF)
        .mockReturnValueOnce(PIIAccessLevel.BASIC)
        .mockReturnValueOnce(JSON.stringify(['view_basic']));
      
      getDatetime
        .mockReturnValueOnce(new Date('2024-01-01'))
        .mockReturnValueOnce(new Date('2024-12-31'));
      
      getBoolean
        .mockReturnValueOnce(false) // Inactive
        .mockReturnValueOnce(false);

      const isValid = await manager.validateCredentials('cred_123', 'client_456', 'view_client_basic');
      expect(isValid).toBe(false);
    });

    it('should reject requests with insufficient permissions', async () => {
      const { getThing, getStringNoLocale, getDatetime, getBoolean } = require('@inrupt/solid-client');
      
      const mockThing = {};
      getThing.mockReturnValueOnce(mockThing);
      getStringNoLocale
        .mockReturnValueOnce('cred_123')
        .mockReturnValueOnce('user123')
        .mockReturnValueOnce(UserRole.VOLUNTEER)
        .mockReturnValueOnce(PIIAccessLevel.BASIC)
        .mockReturnValueOnce(JSON.stringify(['view_basic'])); // No edit permissions
      
      getDatetime
        .mockReturnValueOnce(new Date('2024-01-01'))
        .mockReturnValueOnce(new Date('2024-12-31'));
      
      getBoolean
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Try to edit with view-only permissions
      const isValid = await manager.validateCredentials('cred_123', 'client_456', 'edit_client_data');
      expect(isValid).toBe(false);
    });
  });

  describe('Audit Reporting', () => {
    it('should generate audit report with correct structure', async () => {
      const { getThingAll } = require('@inrupt/solid-client');
      getThingAll.mockReturnValueOnce([]); // Empty logs for test

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const report = await manager.getAuditReport(startDate, endDate);
      
      expect(report).toHaveProperty('totalAccesses');
      expect(report).toHaveProperty('successfulAccesses');
      expect(report).toHaveProperty('failedAccesses');
      expect(report).toHaveProperty('uniqueUsers');
      expect(report).toHaveProperty('accessesByRole');
      expect(report).toHaveProperty('topAccessedClients');
      
      expect(typeof report.totalAccesses).toBe('number');
      expect(Array.isArray(report.topAccessedClients)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle pod access errors gracefully', async () => {
      const { getSolidDataset } = require('@inrupt/solid-client');
      getSolidDataset.mockRejectedValueOnce(new Error('Pod access denied'));

      const credentials = await manager.getUserCredentials('user123');
      expect(credentials).toEqual([]);
    });

    it('should handle credential not found', async () => {
      const { getThing } = require('@inrupt/solid-client');
      getThing.mockReturnValueOnce(null);

      const isValid = await manager.validateCredentials('nonexistent', 'client_456', 'view_client_basic');
      expect(isValid).toBe(false);
    });
  });

  describe('Credential Revocation', () => {
    it('should revoke credentials with proper logging', async () => {
      const { getThing, saveSolidDatasetAt, addBoolean, addStringNoLocale } = require('@inrupt/solid-client');
      
      const mockThing = {};
      getThing.mockReturnValueOnce(mockThing);
      addBoolean.mockReturnValueOnce(mockThing);
      addStringNoLocale.mockReturnValueOnce(mockThing);
      saveSolidDatasetAt.mockResolvedValueOnce(undefined);

      await expect(manager.revokeCredentials('cred_123', 'Security violation')).resolves.not.toThrow();
      expect(saveSolidDatasetAt).toHaveBeenCalled();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique credential IDs', () => {
      const id1 = manager['generateCredentialId']();
      const id2 = manager['generateCredentialId']();
      
      expect(id1).toMatch(/^cred_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^cred_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique log IDs', () => {
      const id1 = manager['generateLogId']();
      const id2 = manager['generateLogId']();
      
      expect(id1).toMatch(/^log_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^log_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
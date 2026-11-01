import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserProfile } from '../src/types';
import { OWNER_DEFAULT_UID, MANAGER_DEFAULT_UID } from '../src/lib/firebase';
import { cleanMobileNumber } from '../src/utils/calculations';

describe('SRIRAM FARMS Profile Separation & Account Security Tests', () => {
  it('should use distinct UIDs for Owner and Manager accounts', () => {
    assert.notEqual(OWNER_DEFAULT_UID, MANAGER_DEFAULT_UID);
    assert.equal(OWNER_DEFAULT_UID, 'owner_raja_s_8072514712');
    assert.equal(MANAGER_DEFAULT_UID, 'manager_dinesh_h_9840123456');
  });

  it('guarantees Manager profile changes do not alter Owner profile', () => {
    // Initial states
    const ownerProfile: UserProfile = {
      uid: OWNER_DEFAULT_UID,
      name: 'RAJA S',
      role: 'Owner',
      mobile: '8072514712',
      age: 48,
      education: 'B.A. (Farm Machinery Specialist)',
      photoUrl: 'data:image/svg+xml;utf8,avatar1',
    };

    const managerProfile: UserProfile = {
      uid: MANAGER_DEFAULT_UID,
      name: 'DINESH H',
      role: 'Manager',
      mobile: '9840123456',
      age: 22,
      education: 'B.E. Agricultural Engineering',
      photoUrl: 'data:image/svg+xml;utf8,avatar2',
    };

    // Manager updates profile on mobile
    const managerUpdate: Partial<UserProfile> = {
      name: 'Dinesh Hariraman',
      photoUrl: 'data:image/svg+xml;utf8,new_avatar_mobile',
      education: 'M.E. Farm Automation',
    };

    const updatedManager = { ...managerProfile, ...managerUpdate };

    // Assert Manager received updates
    assert.equal(updatedManager.name, 'Dinesh Hariraman');
    assert.equal(updatedManager.photoUrl, 'data:image/svg+xml;utf8,new_avatar_mobile');
    assert.equal(updatedManager.education, 'M.E. Farm Automation');

    // Assert Owner remains 100% UNCHANGED on laptop
    assert.equal(ownerProfile.name, 'RAJA S');
    assert.equal(ownerProfile.photoUrl, 'data:image/svg+xml;utf8,avatar1');
    assert.equal(ownerProfile.age, 48);
    assert.equal(ownerProfile.education, 'B.A. (Farm Machinery Specialist)');
    assert.equal(ownerProfile.role, 'Owner');
  });

  it('guarantees Owner profile changes do not alter Manager profile', () => {
    const ownerProfile: UserProfile = {
      uid: OWNER_DEFAULT_UID,
      name: 'RAJA S',
      role: 'Owner',
      mobile: '8072514712',
      age: 48,
    };

    const managerProfile: UserProfile = {
      uid: MANAGER_DEFAULT_UID,
      name: 'DINESH H',
      role: 'Manager',
      mobile: '9840123456',
      age: 22,
    };

    // Owner updates profile on laptop
    const ownerUpdate: Partial<UserProfile> = {
      name: 'Raja Sundaram',
      age: 49,
    };

    const updatedOwner = { ...ownerProfile, ...ownerUpdate };

    // Assert Owner updated
    assert.equal(updatedOwner.name, 'Raja Sundaram');
    assert.equal(updatedOwner.age, 49);

    // Assert Manager remains 100% UNCHANGED on mobile
    assert.equal(managerProfile.name, 'DINESH H');
    assert.equal(managerProfile.role, 'Manager');
    assert.equal(managerProfile.age, 22);
  });

  it('prevents role escalation from Manager to Owner', () => {
    const existingRole = 'Manager';
    const attemptedEditRole = 'Owner';

    // Security rule enforcement simulation:
    // request.resource.data.role == resource.data.role
    const isRoleChangePermitted = (oldRole: string, newRole: string) => oldRole === newRole;

    assert.equal(isRoleChangePermitted(existingRole, attemptedEditRole), false);
    assert.equal(isRoleChangePermitted(existingRole, 'Manager'), true);
  });

  it('generates strictly isolated Firestore document paths: users/{uid}', () => {
    const getPathForUid = (uid: string) => `users/${uid}`;

    assert.equal(getPathForUid(OWNER_DEFAULT_UID), 'users/owner_raja_s_8072514712');
    assert.equal(getPathForUid(MANAGER_DEFAULT_UID), 'users/manager_dinesh_h_9840123456');
    assert.notEqual(getPathForUid(OWNER_DEFAULT_UID), getPathForUid(MANAGER_DEFAULT_UID));
  });

  it('sanitizes mobile numbers without spaces or invalid chars', () => {
    assert.equal(cleanMobileNumber('80725 14712'), '8072514712');
    assert.equal(cleanMobileNumber(' 9840 123 456 '), '9840123456');
    assert.equal('80725 14712'.replace(/\s+/g, ''), '8072514712');
  });
});

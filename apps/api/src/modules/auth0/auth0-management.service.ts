// apps/api/src/auth0/auth0-management.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateOrUpdateUserPayload, ManagementToken } from './types';

@Injectable()
export class Auth0ManagementService {
  private readonly logger = new Logger(Auth0ManagementService.name);
  private cachedToken: ManagementToken | null = null;
  private managementToken: string | null = null;
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: `https://${config.get('AUTH0_DOMAIN')}/api/v2`,
    });
  }

  // ─── Get Management API Token ───────────────────────────────────────────────
  // Token is cached and refreshed automatically before expiry

  private async getManagementToken(): Promise<string | null> {
    const now = Date.now();

    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.token;
    }

    try {
      const response = await axios.post(
        `https://${this.config.get('AUTH0_DOMAIN')}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.get('AUTH0_MGMT_CLIENT_ID'),
          client_secret: this.config.get('AUTH0_MGMT_CLIENT_SECRET'),
          audience: `https://${this.config.get('AUTH0_DOMAIN')}/api/v2/`,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      this.cachedToken = {
        token: response.data.access_token,
        expiresAt: now + response.data.expires_in * 1000,
      };

      return this.cachedToken.token;
    } catch (error) {
      this.logger.error(
        'Failed to get Auth0 management token',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new InternalServerErrorException(
        'Failed to get Auth0 management token',
      );
    }
  }

  private async authHeaders() {
    const token = await this.getManagementToken();
    return { Authorization: `Bearer ${token}` };
  }

  // ─── Get Auth0 Role ID by name ────────────────────────────────────────────

  private async getRoleId(roleName: string): Promise<string> {
    const response = await this.client.get('/roles');
    const role = response.data.find((r: any) => r.name === roleName);

    if (!role) {
      throw new InternalServerErrorException(
        `Role "${roleName}" not found in Auth0. Create it in Auth0 Dashboard → User Management → Roles.`,
      );
    }

    return role.id;
  }

  // ─── Find existing Auth0 user by email ───────────────────────────────────

  async findUserByEmail(email: string): Promise<string | null> {
    try {
      const response = await this.client.get(
        `/users-by-email?email=${encodeURIComponent(email)}`,
      );
      if (response.data.length > 0) {
        return response.data[0].user_id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─── Find or Create User ─────────────────────────────────────────────────────

  async findOrCreateUser(payload: CreateOrUpdateUserPayload): Promise<string> {
    // Check if user already exists
    let userId = await this.findUserByEmail(payload.email);

    if (userId) {
      this.logger.log(`Found existing Auth0 user: ${userId}`);

      // Update metadata to latest booking
      await this.client.patch(`/users/${userId}`, {
        app_metadata: {
          bookingId: payload.bookingId,
          guestTier: payload.guestTier,
        },
      });
    } else {
      // Create new user in passwordless email connection
      const createResponse = await this.client.post('/users', {
        email: payload.email,
        email_verified: true,
        connection: 'email',
        given_name: payload.firstName,
        family_name: payload.lastName,
        app_metadata: {
          bookingId: payload.bookingId,
          guestTier: payload.guestTier,
        },
      });
      userId = createResponse.data.user_id as string;
      this.logger.log(`Created Auth0 user: ${userId}`);
    }

    // Remove existing roles
    try {
      const existingRoles = await this.client.get(`/users/${userId}/roles`);
      if (existingRoles.data.length > 0) {
        await this.client.delete(`/users/${userId}/roles`, {
          data: { roles: existingRoles.data.map((r: any) => r.id) },
        });
      }
    } catch {
      // Ignore if no roles exist
    }

    // Assign new role
    const roleId = await this.getRoleId(payload.role);
    await this.client.post(`/users/${userId}/roles`, {
      roles: [roleId],
    });

    return userId;
  }

  // ─── Revoke All Sessions (on checkout) ───────────────────────────────────────

  async revokeUserSessions(userId: string): Promise<void> {
    const headers = await this.authHeaders();

    try {
      // Invalidate all refresh tokens
      await this.client.delete(`/users/${userId}/sessions`, { headers });
      this.logger.log(`Revoked all sessions for user: ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Could not revoke sessions for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ─── Assign Role ─────────────────────────────────────────────────────────────

  async assignRole(userId: string, roleName: string): Promise<void> {
    const headers = await this.authHeaders();

    // Get all roles and find the one we need
    const rolesResponse = await this.client.get('/roles', { headers });
    const role = rolesResponse.data.find((r: any) => r.name === roleName);

    if (!role) {
      throw new Error(`Role ${roleName} not found in Auth0`);
    }

    // Remove existing roles first
    const userRolesResponse = await this.client.get(`/users/${userId}/roles`, {
      headers,
    });
    if (userRolesResponse.data.length > 0) {
      await this.client.delete(`/users/${userId}/roles`, {
        headers,
        data: { roles: userRolesResponse.data.map((r: any) => r.id) },
      });
    }

    // Assign new role
    await this.client.post(
      `/users/${userId}/roles`,
      { roles: [role.id] },
      { headers },
    );
  }

  // ─── Update Booking Metadata ──────────────────────────────────────────────────

  async updateUserMetadata(
    userId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    const headers = await this.authHeaders();
    await this.client.patch(
      `/users/${userId}`,
      { app_metadata: metadata },
      { headers },
    );
  }
}

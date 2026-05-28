// apps/api/src/auth0/auth0-management.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface CreateUserPayload {
  email: string;
  role: 'primary_member' | 'secondary_guest';
  bookingId: string;
  guestTier: 'primary' | 'secondary';
  firstName: string;
  lastName: string;
}

@Injectable()
export class Auth0ManagementService {
  private readonly logger = new Logger(Auth0ManagementService.name);
  private managementToken: string | null = null;
  private tokenExpiry: number = 0;
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

    if (this.managementToken && this.tokenExpiry > now + 60000) {
      return this.managementToken;
    }

    const response = await axios.post(
      `https://${this.config.get('AUTH0_DOMAIN')}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: this.config.get('AUTH0_MGMT_CLIENT_ID'),
        client_secret: this.config.get('AUTH0_MGMT_CLIENT_SECRET'),
        audience: `https://${this.config.get('AUTH0_DOMAIN')}/api/v2/`,
      },
    );

    this.managementToken = response.data.access_token;
    this.tokenExpiry = now + response.data.expires_in * 1000;
    return this.managementToken;
  }

  private async authHeaders() {
    const token = await this.getManagementToken();
    return { Authorization: `Bearer ${token}` };
  }

  // ─── Find or Create User ─────────────────────────────────────────────────────

  async findOrCreateUser(payload: CreateUserPayload): Promise<string> {
    const headers = await this.authHeaders();

    // Search for existing user
    const searchResponse = await this.client.get(
      `/users-by-email?email=${encodeURIComponent(payload.email)}`,
      { headers },
    );

    if (searchResponse.data.length > 0) {
      const existingUser = searchResponse.data[0];
      this.logger.log(`Found existing Auth0 user: ${existingUser.user_id}`);

      // Update metadata to latest booking
      await this.client.patch(
        `/users/${existingUser.user_id}`,
        {
          app_metadata: {
            bookingId: payload.bookingId,
            guestTier: payload.guestTier,
          },
        },
        { headers },
      );

      // Update role
      await this.assignRole(existingUser.user_id, payload.role);

      return existingUser.user_id;
    }

    // Create new user in passwordless email connection
    const newUserResponse = await this.client.post(
      '/users',
      {
        email: payload.email,
        email_verified: true,
        connection: 'email',
        given_name: payload.firstName,
        family_name: payload.lastName,
        app_metadata: {
          bookingId: payload.bookingId,
          guestTier: payload.guestTier,
        },
      },
      { headers },
    );

    const newUserId = newUserResponse.data.user_id;
    this.logger.log(`Created new Auth0 user: ${newUserId}`);

    // Assign role
    await this.assignRole(newUserId, payload.role);

    return newUserId;
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

  // ─── Revoke All Sessions (on checkout) ───────────────────────────────────────

  async revokeUserSessions(userId: string): Promise<void> {
    const headers = await this.authHeaders();

    try {
      // Invalidate all refresh tokens
      await this.client.delete(`/users/${userId}/sessions`, { headers });
      this.logger.log(`Revoked all sessions for user: ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Could not revoke sessions for ${userId}: ${error.message}`,
      );
    }
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

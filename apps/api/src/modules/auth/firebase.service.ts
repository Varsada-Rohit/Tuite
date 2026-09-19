import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Wraps Firebase Admin SDK for verifying Firebase ID tokens.
 * Initializes the Firebase app on module startup using the
 * project ID from environment variables.
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      });
      this.logger.log('Firebase Admin SDK initialized');
    }
  }

  /**
   * Verifies a Firebase ID token and returns the decoded token.
   * @throws Error if the token is invalid or expired.
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }
}

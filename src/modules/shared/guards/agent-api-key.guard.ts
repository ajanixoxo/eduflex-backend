import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Env } from '../constants';

/**
 * Guard for AI Agent API authentication
 * Validates the X-Agent-API-Key header against the configured AGENT_API_KEY
 */
@Injectable()
export class AgentApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-agent-api-key'];

    // If no AGENT_API_KEY is configured, allow all requests (for development)
    if (!Env.AGENT_API_KEY) {
      return true;
    }

    if (!apiKey) {
      throw new UnauthorizedException('Agent API key not provided');
    }

    if (apiKey !== Env.AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    return true;
  }
}

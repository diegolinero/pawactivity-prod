import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;

    const message = typeof payload === 'string'
      ? payload
      : Array.isArray((payload as { message?: unknown })?.message)
        ? (payload as { message: string[] }).message[0]
        : (payload as { message?: string })?.message ?? 'Internal server error';

    const logPayload = {
      event: 'http_exception',
      method: request?.method,
      path: request?.url,
      statusCode: status,
      message,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload), exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}

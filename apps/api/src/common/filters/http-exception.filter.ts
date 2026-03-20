import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;

    const message = typeof payload === 'string'
      ? payload
      : Array.isArray((payload as { message?: unknown })?.message)
        ? (payload as { message: string[] }).message[0]
        : (payload as { message?: string })?.message ?? 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}

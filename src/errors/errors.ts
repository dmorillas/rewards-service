export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class IllegalStatusError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}

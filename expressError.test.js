const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} = require("./expressError");

describe("Express Error", () => {
  it("should set the correct message and status", () => {
    const error = new ExpressError("Test Error", 500);
    expect(error.message).toBe("Test Error");
    expect(error.status).toBe(500);
  });
  it("should have default values for message and status", () => {
    const error = new ExpressError();
    expect(error.message).toBe(undefined);
    expect(error.status).toBe(undefined);
  });
});

describe("NotFoundError", () => {
  it("should set the correct default message and status", () => {
    const error = new NotFoundError();
    expect(error.message).toBe("Not Found");
    expect(error.status).toBe(404);
  });

  it("should allow a custom message", () => {
    const error = new NotFoundError("Custom Not Found Message");
    expect(error.message).toBe("Custom Not Found Message");
    expect(error.status).toBe(404);
  });
});

describe("UnauthorizedError", () => {
  it("should set the correct default message and status", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.status).toBe(401);
  });

  it("should allow a custom message", () => {
    const error = new UnauthorizedError("Custom Unauthorized Message");
    expect(error.message).toBe("Custom Unauthorized Message");
    expect(error.status).toBe(401);
  });
});

describe("BadRequestError", () => {
  it("should set the correct default message and status", () => {
    const error = new BadRequestError();
    expect(error.message).toBe("Bad Request");
    expect(error.status).toBe(400);
  });

  it("should allow a custom message", () => {
    const error = new BadRequestError("Custom Bad Request Message");
    expect(error.message).toBe("Custom Bad Request Message");
    expect(error.status).toBe(400);
  });
});

describe("ForbiddenError", () => {
  it("should set the correct default message and status", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Bad Request");
    expect(error.status).toBe(403);
  });

  it("should allow a custom message", () => {
    const error = new ForbiddenError("Custom Forbidden Message");
    expect(error.message).toBe("Custom Forbidden Message");
    expect(error.status).toBe(403);
  });
});

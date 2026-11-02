// Validates req[source] with a zod schema and replaces it with the parsed value.
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err); // ZodError is formatted by errorHandler
  }
};
